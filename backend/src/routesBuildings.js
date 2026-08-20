const express = require('express');
const crypto = require('crypto');
const { db, logAudit } = require('./db');
const { requireAuth, requireRole } = require('./auth');

const router = express.Router();
router.use(requireAuth);

const CATEGORY_COLORS = { BN: '#2563eb', EX: '#16a34a', AF: '#eab308', BR: '#dc2626', BB: '#9333ea' };

function rowToApi(r) {
  return { ...r, color: CATEGORY_COLORS[r.category_code] || '#64748b' };
}

// GET /buildings - list/filter (WEB-007 / BRD filter list section 8)
router.get('/buildings', (req, res) => {
  const { kebun, rayon, afdeling, blok, building_type, category_code, year, q, limit } = req.query;
  let sql = 'SELECT * FROM buildings WHERE deleted = 0';
  const params = [];
  if (kebun) { sql += ' AND kebun = ?'; params.push(kebun); }
  if (rayon) { sql += ' AND rayon = ?'; params.push(rayon); }
  if (afdeling) { sql += ' AND afdeling = ?'; params.push(afdeling); }
  if (blok) { sql += ' AND blok = ?'; params.push(blok); }
  if (building_type) { sql += ' AND building_type = ?'; params.push(building_type); }
  if (category_code) { sql += ' AND category_code = ?'; params.push(category_code); }
  if (year) { sql += ' AND roadmap_year = ?'; params.push(Number(year)); }
  if (q) { sql += ' AND (no_unit LIKE ? OR capital LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY id ASC';
  if (limit) sql += ` LIMIT ${Number(limit) || 500}`;
  const rows = db.prepare(sql).all(...params);
  res.json({ count: rows.length, items: rows.map(rowToApi) });
});

router.get('/buildings/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM buildings WHERE id = ? AND deleted = 0').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const photos = db.prepare('SELECT id, data_url, captured_at, latitude, longitude, uploaded_by, source FROM photos WHERE building_id = ? ORDER BY captured_at DESC').all(req.params.id);
  res.json({ ...rowToApi(row), photos });
});

// POST /buildings - create (Admin+, WEB-009)
router.post('/buildings', requireRole('admin', 'superadmin'), (req, res) => {
  const b = req.body || {};
  const uuid = b.uuid || crypto.randomUUID();
  const stmt = db.prepare(`INSERT INTO buildings
    (uuid, no_unit, kebun, rayon, afdeling, blok, capital, building_type, subtype, unit_count, pintu,
     tahun_bangun, category_code, estimasi_capital, estimasi_unit, estimasi_pintu, roadmap_year, keterangan_af,
     latitude, longitude, accuracy, progress_value, progress_date, progress_note, source, created_by, updated_by)
    VALUES (@uuid,@no_unit,@kebun,@rayon,@afdeling,@blok,@capital,@building_type,@subtype,@unit_count,@pintu,
     @tahun_bangun,@category_code,@estimasi_capital,@estimasi_unit,@estimasi_pintu,@roadmap_year,@keterangan_af,
     @latitude,@longitude,@accuracy,@progress_value,@progress_date,@progress_note,@source,@created_by,@updated_by)`);
  const payload = {
    uuid, no_unit: b.no_unit || null, kebun: b.kebun || null, rayon: b.rayon || null, afdeling: b.afdeling || null, blok: b.blok || null,
    capital: b.capital || null, building_type: b.building_type || null, subtype: b.subtype || null,
    unit_count: b.unit_count ?? 1, pintu: b.pintu ?? 0, tahun_bangun: b.tahun_bangun || null,
    category_code: b.category_code || 'EX', estimasi_capital: b.estimasi_capital || b.capital || null,
    estimasi_unit: b.estimasi_unit ?? b.unit_count ?? 1, estimasi_pintu: b.estimasi_pintu ?? b.pintu ?? 0,
    roadmap_year: b.roadmap_year || null, keterangan_af: b.keterangan_af || null,
    latitude: b.latitude ?? null, longitude: b.longitude ?? null, accuracy: b.accuracy ?? null,
    progress_value: b.progress_value ?? 0, progress_date: b.progress_date || null, progress_note: b.progress_note || null,
    source: b.source || 'WEB', created_by: req.user.username, updated_by: req.user.username,
  };
  const info = stmt.run(payload);
  logAudit({ entity: 'buildings', recordId: info.lastInsertRowid, action: 'CREATE', newValue: payload, user: req.user.username, source: payload.source });
  const row = db.prepare('SELECT * FROM buildings WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(rowToApi(row));
});

// PUT /buildings/:id - update (Admin+)
router.put('/buildings/:id', requireRole('admin', 'superadmin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM buildings WHERE id = ? AND deleted = 0').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const b = req.body || {};
  const merged = { ...existing, ...b, updated_by: req.user.username };
  db.prepare(`UPDATE buildings SET
    no_unit=@no_unit, kebun=@kebun, rayon=@rayon, afdeling=@afdeling, blok=@blok, capital=@capital,
    building_type=@building_type, subtype=@subtype, unit_count=@unit_count, pintu=@pintu, tahun_bangun=@tahun_bangun,
    category_code=@category_code, estimasi_capital=@estimasi_capital, estimasi_unit=@estimasi_unit, estimasi_pintu=@estimasi_pintu,
    roadmap_year=@roadmap_year, keterangan_af=@keterangan_af, latitude=@latitude, longitude=@longitude, accuracy=@accuracy,
    progress_value=@progress_value, progress_date=@progress_date, progress_note=@progress_note,
    updated_by=@updated_by, updated_at=datetime('now')
    WHERE id=@id`).run(merged);
  logAudit({ entity: 'buildings', recordId: req.params.id, action: 'UPDATE', oldValue: existing, newValue: merged, user: req.user.username, source: b.source || 'WEB' });
  const row = db.prepare('SELECT * FROM buildings WHERE id = ?').get(req.params.id);
  res.json(rowToApi(row));
});

// DELETE -> soft delete (Admin+), per BRD governance: no hard delete of historical data
router.delete('/buildings/:id', requireRole('admin', 'superadmin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM buildings WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare("UPDATE buildings SET deleted = 1, updated_by = ?, updated_at = datetime('now') WHERE id = ?").run(req.user.username, req.params.id);
  logAudit({ entity: 'buildings', recordId: req.params.id, action: 'SOFT_DELETE', oldValue: existing, user: req.user.username });
  res.json({ ok: true });
});

// POST /progress - create/update progress entry for a building
router.post('/progress', (req, res) => {
  const { building_id, progress_value, progress_date, note } = req.body || {};
  const existing = db.prepare('SELECT * FROM buildings WHERE id = ? AND deleted = 0').get(building_id);
  if (!existing) return res.status(404).json({ error: 'Building not found' });
  db.prepare(`UPDATE buildings SET progress_value=?, progress_date=?, progress_note=?, updated_by=?, updated_at=datetime('now') WHERE id=?`)
    .run(progress_value ?? existing.progress_value, progress_date || existing.progress_date, note || existing.progress_note, req.user.username, building_id);
  logAudit({ entity: 'progress', recordId: building_id, action: 'UPDATE', oldValue: { progress_value: existing.progress_value }, newValue: { progress_value }, user: req.user.username, source: req.body.source || 'WEB' });
  res.json(db.prepare('SELECT * FROM buildings WHERE id = ?').get(building_id));
});

// POST /photos - upload photo (base64 data URL for demo simplicity)
router.post('/photos', (req, res) => {
  const { building_id, data_url, latitude, longitude } = req.body || {};
  if (!building_id || !data_url) return res.status(400).json({ error: 'building_id and data_url required' });
  const info = db.prepare(`INSERT INTO photos (building_id, data_url, latitude, longitude, uploaded_by, source)
    VALUES (?,?,?,?,?,?)`).run(building_id, data_url, latitude || null, longitude || null, req.user.username, req.body.source || 'WEB');
  logAudit({ entity: 'photos', recordId: info.lastInsertRowid, action: 'CREATE', newValue: { building_id }, user: req.user.username });
  res.status(201).json({ id: info.lastInsertRowid, ok: true });
});

router.get('/photos/latest', (req, res) => {
  const limit = Number(req.query.limit) || 12;
  const rows = db.prepare(`SELECT p.*, b.no_unit, b.capital, b.category_code FROM photos p
    JOIN buildings b ON b.id = p.building_id WHERE b.deleted = 0 ORDER BY p.captured_at DESC LIMIT ?`).all(limit);
  res.json(rows);
});

module.exports = router;
