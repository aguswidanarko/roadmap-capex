const express = require('express');
const crypto = require('crypto');
const { db, logAudit } = require('./db');
const { requireAuth, requireRole } = require('./auth');
const { lookupKebunMeta } = require('./kebunMeta');
const { normalizeJenisBangunan } = require('./jenisBangunanRemap');

const router = express.Router();
router.use(requireAuth);

const CATEGORY_COLORS = { BN: '#2563eb', EX: '#16a34a', AF: '#eab308', BR: '#dc2626', BB: '#9333ea' };

function rowToApi(r) {
  return { ...r, color: CATEGORY_COLORS[r.category_code] || '#64748b' };
}

// GET /buildings - list/filter (WEB-007 / BRD filter list section 8)
router.get('/buildings', (req, res) => {
  const { region, pt, kebun, rayon, afdeling, blok, building_type, category_code, year, q, limit } = req.query;
  let sql = 'SELECT * FROM buildings WHERE deleted = 0';
  const params = [];
  if (region) { sql += ' AND region = ?'; params.push(region); }
  if (pt) { sql += ' AND pt = ?'; params.push(pt); }
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
  const meta = lookupKebunMeta(b.kebun);
  const stmt = db.prepare(`INSERT INTO buildings
    (uuid, no_unit, kebun, region, pt, rayon, afdeling, blok, capital, building_type, subtype, unit_count, pintu,
     tahun_bangun, category_code, estimasi_capital, estimasi_unit, estimasi_pintu, roadmap_year, biaya, keterangan_af,
     latitude, longitude, accuracy, progress_value, progress_date, progress_note, source, created_by, updated_by)
    VALUES (@uuid,@no_unit,@kebun,@region,@pt,@rayon,@afdeling,@blok,@capital,@building_type,@subtype,@unit_count,@pintu,
     @tahun_bangun,@category_code,@estimasi_capital,@estimasi_unit,@estimasi_pintu,@roadmap_year,@biaya,@keterangan_af,
     @latitude,@longitude,@accuracy,@progress_value,@progress_date,@progress_note,@source,@created_by,@updated_by)`);
  const payload = {
    uuid, no_unit: b.no_unit || null, kebun: b.kebun || null,
    region: b.region || meta.region || null, pt: b.pt || meta.pt || null,
    rayon: b.rayon || null, afdeling: b.afdeling || null, blok: b.blok || null,
    capital: b.capital || null, building_type: normalizeJenisBangunan(b.building_type) || null, subtype: b.subtype || null,
    unit_count: b.unit_count ?? 1, pintu: b.pintu ?? 0, tahun_bangun: b.tahun_bangun || null,
    category_code: b.category_code || 'EX', estimasi_capital: b.estimasi_capital || b.capital || null,
    estimasi_unit: b.estimasi_unit ?? b.unit_count ?? 1, estimasi_pintu: b.estimasi_pintu ?? b.pintu ?? 0,
    roadmap_year: b.roadmap_year || null, biaya: b.biaya ?? 0, keterangan_af: b.keterangan_af || null,
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
  merged.building_type = normalizeJenisBangunan(merged.building_type);
  if (!b.region && !b.pt && b.kebun && b.kebun !== existing.kebun) {
    const meta = lookupKebunMeta(b.kebun);
    merged.region = merged.region || meta.region;
    merged.pt = merged.pt || meta.pt;
  }
  db.prepare(`UPDATE buildings SET
    no_unit=@no_unit, kebun=@kebun, region=@region, pt=@pt, rayon=@rayon, afdeling=@afdeling, blok=@blok, capital=@capital,
    building_type=@building_type, subtype=@subtype, unit_count=@unit_count, pintu=@pintu, tahun_bangun=@tahun_bangun,
    category_code=@category_code, estimasi_capital=@estimasi_capital, estimasi_unit=@estimasi_unit, estimasi_pintu=@estimasi_pintu,
    roadmap_year=@roadmap_year, biaya=@biaya, keterangan_af=@keterangan_af, latitude=@latitude, longitude=@longitude, accuracy=@accuracy,
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

// POST /photos - upload photo (base64 data URL for demo simplicity). building_id is now
// optional: a photo can stand alone (e.g. a general campus/facility shot) carrying its own
// kebun/region/pt/blok, or be linked to one building as before.
router.post('/photos', (req, res) => {
  const { building_id, data_url, latitude, longitude, kebun, blok, title } = req.body || {};
  if (!data_url) return res.status(400).json({ error: 'data_url required' });
  let loc = { kebun: kebun || null, region: req.body.region || null, pt: req.body.pt || null, blok: blok || null };
  if (building_id) {
    const b = db.prepare('SELECT kebun, region, pt, blok FROM buildings WHERE id = ? AND deleted = 0').get(building_id);
    if (!b) return res.status(404).json({ error: 'Building not found' });
    loc = { kebun: loc.kebun || b.kebun, region: loc.region || b.region, pt: loc.pt || b.pt, blok: loc.blok || b.blok };
  } else if (loc.kebun && (!loc.region || !loc.pt)) {
    const meta = lookupKebunMeta(loc.kebun);
    loc.region = loc.region || meta.region;
    loc.pt = loc.pt || meta.pt;
  }
  const info = db.prepare(`INSERT INTO photos (building_id, kebun, region, pt, blok, title, data_url, latitude, longitude, uploaded_by, source)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(building_id || null, loc.kebun, loc.region, loc.pt, loc.blok, title || null,
    data_url, latitude || null, longitude || null, req.user.username, req.body.source || 'WEB');
  logAudit({ entity: 'photos', recordId: info.lastInsertRowid, action: 'CREATE', newValue: { building_id, kebun: loc.kebun, blok: loc.blok }, user: req.user.username });
  res.status(201).json({ id: info.lastInsertRowid, ok: true });
});

// GET /photos/latest - gallery list, filterable by region/pt, general (non-featured) list
router.get('/photos/latest', (req, res) => {
  const limit = Number(req.query.limit) || 48;
  const { region, pt } = req.query;
  let sql = `SELECT p.*, b.no_unit, b.capital AS building_capital, b.category_code FROM photos p
    LEFT JOIN buildings b ON b.id = p.building_id WHERE p.deleted = 0`;
  const params = [];
  if (region) { sql += ' AND p.region = ?'; params.push(region); }
  if (pt) { sql += ' AND p.pt = ?'; params.push(pt); }
  sql += ' ORDER BY p.captured_at DESC LIMIT ?';
  params.push(limit);
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map((r) => ({ ...r, capital: r.title || r.building_capital || r.capital })));
});

// GET /photos/featured - up to 8 admin-picked photos for the Dashboard slideshow
router.get('/photos/featured', (req, res) => {
  const rows = db.prepare(`SELECT p.*, b.no_unit, b.capital AS building_capital, b.category_code FROM photos p
    LEFT JOIN buildings b ON b.id = p.building_id
    WHERE p.deleted = 0 AND p.featured = 1
    ORDER BY COALESCE(p.featured_order, 999), p.captured_at DESC LIMIT 8`).all();
  res.json(rows.map((r) => ({ ...r, capital: r.title || r.building_capital || r.capital })));
});

// PUT /photos/:id/feature - admin toggles whether a photo shows in the Dashboard slideshow
router.put('/photos/:id/feature', requireRole('admin', 'superadmin'), (req, res) => {
  const { featured, featured_order } = req.body || {};
  const existing = db.prepare('SELECT * FROM photos WHERE id = ? AND deleted = 0').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (featured) {
    const count = db.prepare('SELECT COUNT(*) c FROM photos WHERE featured = 1 AND deleted = 0').get().c;
    if (count >= 8 && !existing.featured) return res.status(400).json({ error: 'Maksimum 8 foto unggulan untuk slideshow dashboard. Lepas salah satu dulu.' });
  }
  db.prepare('UPDATE photos SET featured = ?, featured_order = ? WHERE id = ?').run(featured ? 1 : 0, featured_order ?? null, req.params.id);
  logAudit({ entity: 'photos', recordId: req.params.id, action: featured ? 'FEATURE' : 'UNFEATURE', user: req.user.username });
  res.json(db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id));
});

// DELETE /photos/:id - soft delete (Admin+)
router.delete('/photos/:id', requireRole('admin', 'superadmin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE photos SET deleted = 1 WHERE id = ?').run(req.params.id);
  logAudit({ entity: 'photos', recordId: req.params.id, action: 'SOFT_DELETE', user: req.user.username });
  res.json({ ok: true });
});

module.exports = router;
