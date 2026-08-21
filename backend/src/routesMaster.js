const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const crypto = require('crypto');
const { db, logAudit } = require('./db');
const { requireAuth, requireRole } = require('./auth');
const { lookupKebunMeta } = require('./kebunMeta');
const { normalizeJenisBangunan } = require('./jenisBangunanRemap');

const router = express.Router();
router.use(requireAuth);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const VALID_CATEGORIES = new Set(['BN', 'EX', 'AF', 'BR', 'BB']);
const VALID_YEARS = new Set([2026, 2027, 2028, 2029, 2030]);

// GET /master/* - reference/master data for mobile & dashboard (WEB-008 support)
router.get('/master/building-types', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT building_type FROM subtype_breakdown ORDER BY building_type').all();
  res.json(rows.map(r => r.building_type));
});
router.get('/master/subtypes', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT building_type, capital FROM subtype_breakdown ORDER BY building_type, capital').all();
  res.json(rows);
});
router.get('/master/locations', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT kebun, rayon, afdeling, blok FROM buildings WHERE deleted=0').all();
  res.json(rows);
});
// GET /master/regions - distinct regions present in the data, for the Region dropdown
router.get('/master/regions', (req, res) => {
  const rows = db.prepare(`SELECT DISTINCT region FROM buildings WHERE deleted=0 AND region IS NOT NULL AND region != '' ORDER BY region`).all();
  res.json(rows.map((r) => r.region));
});
// GET /master/pts?region=... - distinct PT/Kebun present in the data, for the PT dropdown
router.get('/master/pts', (req, res) => {
  const { region } = req.query;
  let sql = `SELECT DISTINCT pt FROM buildings WHERE deleted=0 AND pt IS NOT NULL AND pt != ''`;
  const params = [];
  if (region) { sql += ' AND region = ?'; params.push(region); }
  sql += ' ORDER BY pt';
  res.json(db.prepare(sql).all(...params).map((r) => r.pt));
});
router.get('/master/categories', (req, res) => {
  res.json([
    { code: 'BN', label: 'Bangun Baru', color: '#2563eb' },
    { code: 'EX', label: 'Existing', color: '#16a34a' },
    { code: 'AF', label: 'Alih Fungsi', color: '#eab308' },
    { code: 'BR', label: 'Bongkar', color: '#dc2626' },
    { code: 'BB', label: 'Bongkar & Bangun', color: '#9333ea' },
  ]);
});

function validateRow(row, seenKeys) {
  const errors = [];
  const lokasi = `${row.kebun || ''}|${row.rayon || ''}|${row.afdeling || ''}|${row.blok || ''}`;
  const noUnit = row.no_unit ?? row.No_Unit ?? row['No Unit'];
  if (!lokasi.trim() || lokasi === '|||') errors.push('Lokasi (kebun/rayon/afdeling/blok) wajib diisi');
  if (!noUnit) errors.push('No Unit wajib diisi');
  if (!row.building_type && !row.capital) errors.push('Jenis bangunan wajib diisi');
  const cat = (row.category_code || row.kategori || row.sign || '').toUpperCase();
  if (!cat) errors.push('Kategori wajib diisi'); else if (!VALID_CATEGORIES.has(cat)) errors.push(`Kategori '${cat}' tidak valid (harus BN/EX/AF/BR/BB)`);
  const dupKey = `${lokasi}|${noUnit}`;
  let isDuplicate = false;
  if (seenKeys.has(dupKey)) { errors.push('Duplicate: kombinasi lokasi + no unit sudah ada di file ini'); isDuplicate = true; }
  seenKeys.add(dupKey);
  for (const f of ['unit', 'unit_count', 'pintu', 'biaya']) {
    if (row[f] !== undefined && row[f] !== '' && isNaN(Number(row[f]))) errors.push(`Field '${f}' harus angka`);
  }
  if (row.tahun_bangun && isNaN(Number(row.tahun_bangun))) errors.push('Tahun bangun harus angka');
  if (row.roadmap_year && !VALID_YEARS.has(Number(row.roadmap_year))) errors.push('Tahun program harus 2026-2030');
  if (row.latitude !== undefined && row.latitude !== '' && (isNaN(Number(row.latitude)) || Math.abs(Number(row.latitude)) > 90)) errors.push('Latitude tidak valid');
  if (row.longitude !== undefined && row.longitude !== '' && (isNaN(Number(row.longitude)) || Math.abs(Number(row.longitude)) > 180)) errors.push('Longitude tidak valid');
  return { errors, isDuplicate, category_code: cat };
}

const previewCache = new Map(); // batchId -> { rows, filename }

// POST /master/import - upload file, run pre-validation, return preview (does NOT commit)
router.post('/master/import', requireRole('admin', 'superadmin'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file is required (multipart field "file")' });
  let rows;
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  } catch (e) {
    return res.status(400).json({ error: 'Failed to parse file: ' + e.message });
  }
  const seenKeys = new Set();
  let validCount = 0, invalidCount = 0, duplicateCount = 0;
  const results = rows.map((row, idx) => {
    const { errors, isDuplicate, category_code } = validateRow(row, seenKeys);
    if (isDuplicate) duplicateCount += 1;
    if (errors.length) invalidCount += 1; else validCount += 1;
    return { rowNumber: idx + 2, data: row, category_code, valid: errors.length === 0, errors };
  });
  const batchId = crypto.randomUUID();
  previewCache.set(batchId, { rows: results, filename: req.file.originalname, uploadedBy: req.user.username });
  db.prepare(`INSERT INTO import_batches (batch_id, filename, total_rows, valid_rows, invalid_rows, duplicate_rows, status, uploaded_by, errors_json)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(batchId, req.file.originalname, rows.length, validCount, invalidCount, duplicateCount, 'Preview', req.user.username,
    JSON.stringify(results.filter(r => !r.valid)));
  res.json({
    batch_id: batchId, filename: req.file.originalname,
    total_rows: rows.length, valid_rows: validCount, invalid_rows: invalidCount, duplicate_rows: duplicateCount,
    preview: results.slice(0, 50),
  });
});

// POST /master/import/:batchId/commit - commit only valid rows from a previewed batch
router.post('/master/import/:batchId/commit', requireRole('admin', 'superadmin'), (req, res) => {
  const cached = previewCache.get(req.params.batchId);
  if (!cached) return res.status(404).json({ error: 'Batch not found or expired; re-upload the file' });
  const insertStmt = db.prepare(`INSERT INTO buildings
    (uuid, no_unit, kebun, region, pt, rayon, afdeling, blok, capital, building_type, subtype, unit_count, pintu,
     tahun_bangun, category_code, estimasi_capital, estimasi_unit, estimasi_pintu, roadmap_year, biaya, keterangan_af,
     latitude, longitude, accuracy, progress_value, progress_date, progress_note, source, created_by, updated_by)
    VALUES (@uuid,@no_unit,@kebun,@region,@pt,@rayon,@afdeling,@blok,@capital,@building_type,@subtype,@unit_count,@pintu,
     @tahun_bangun,@category_code,@estimasi_capital,@estimasi_unit,@estimasi_pintu,@roadmap_year,@biaya,@keterangan_af,
     @latitude,@longitude,@accuracy,@progress_value,@progress_date,@progress_note,@source,@created_by,@updated_by)`);
  let committed = 0;
  const tx = db.transaction(() => {
    for (const r of cached.rows) {
      if (!r.valid) continue;
      const row = r.data;
      const meta = lookupKebunMeta(row.kebun);
      insertStmt.run({
        uuid: crypto.randomUUID(),
        no_unit: String(row.no_unit ?? row['No Unit'] ?? ''),
        kebun: row.kebun || null,
        region: row.region || meta.region || null, pt: row.pt || meta.pt || null,
        rayon: row.rayon || null, afdeling: row.afdeling || null, blok: row.blok || null,
        capital: row.capital || row.building_type || null,
        building_type: normalizeJenisBangunan(row.building_type || row.capital || null),
        subtype: row.subtype || row.capital || null,
        unit_count: Number(row.unit_count || row.unit || 1), pintu: Number(row.pintu || 0),
        tahun_bangun: row.tahun_bangun ? Number(row.tahun_bangun) : null,
        category_code: r.category_code,
        estimasi_capital: row.estimasi_capital || row.capital || null,
        estimasi_unit: Number(row.estimasi_unit || row.unit_count || 1), estimasi_pintu: Number(row.estimasi_pintu || row.pintu || 0),
        roadmap_year: row.roadmap_year ? Number(row.roadmap_year) : null,
        biaya: Number(row.biaya || 0),
        keterangan_af: row.keterangan_af || null,
        latitude: row.latitude ? Number(row.latitude) : null, longitude: row.longitude ? Number(row.longitude) : null,
        accuracy: row.accuracy ? Number(row.accuracy) : null,
        progress_value: Number(row.progress_value || 0), progress_date: row.progress_date || null, progress_note: row.progress_note || null,
        source: 'IMPORT', created_by: req.user.username, updated_by: req.user.username,
      });
      committed += 1;
    }
    db.prepare(`UPDATE import_batches SET status = 'Committed' WHERE batch_id = ?`).run(req.params.batchId);
  });
  tx();
  logAudit({ entity: 'master_import', recordId: req.params.batchId, action: 'IMPORT_COMMIT', newValue: { committed }, user: req.user.username, source: 'IMPORT' });
  previewCache.delete(req.params.batchId);
  res.json({ ok: true, committed });
});

router.get('/master/import-batches', (req, res) => {
  res.json(db.prepare('SELECT * FROM import_batches ORDER BY uploaded_at DESC LIMIT 50').all());
});

module.exports = router;
