const express = require('express');
const { db, logAudit } = require('./db');
const { requireAuth, requireRole } = require('./auth');
const { lookupKebunMeta } = require('./kebunMeta');

const router = express.Router();
router.use(requireAuth);

// GET /campus-maps - list uploaded campus map documents (Peta Kampus page), filterable by
// region/pt/kebun/rayon/afdeling/blok. This is the "Halaman Peta menjadi halaman peta kampus"
// feature: a list of scanned/exported campus map files (e.g. PDF/image per blok) rather than
// the older live pin map.
router.get('/campus-maps', (req, res) => {
  const { region, pt, kebun, rayon, afdeling, blok } = req.query;
  let sql = 'SELECT id, kebun, region, pt, rayon, afdeling, blok, title, mime_type, uploaded_by, uploaded_at FROM campus_maps WHERE deleted = 0';
  const params = [];
  if (region) { sql += ' AND region = ?'; params.push(region); }
  if (pt) { sql += ' AND pt = ?'; params.push(pt); }
  if (kebun) { sql += ' AND kebun = ?'; params.push(kebun); }
  if (rayon) { sql += ' AND rayon = ?'; params.push(rayon); }
  if (afdeling) { sql += ' AND afdeling = ?'; params.push(afdeling); }
  if (blok) { sql += ' AND blok = ?'; params.push(blok); }
  sql += ' ORDER BY uploaded_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// GET /campus-maps/:id - full record including the file data (for preview/download)
router.get('/campus-maps/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM campus_maps WHERE id = ? AND deleted = 0').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// GET /campus-maps/latest - up to N most recent, for the Dashboard's Peta Kampus slideshow
router.get('/campus-maps/preview/slideshow', (req, res) => {
  const limit = Number(req.query.limit) || 8;
  const { region, pt } = req.query;
  let sql = 'SELECT id, kebun, region, pt, blok, title, mime_type, uploaded_at FROM campus_maps WHERE deleted = 0';
  const params = [];
  if (region) { sql += ' AND region = ?'; params.push(region); }
  if (pt) { sql += ' AND pt = ?'; params.push(pt); }
  sql += ' ORDER BY uploaded_at DESC LIMIT ?';
  params.push(limit);
  res.json(db.prepare(sql).all(...params));
});

// POST /campus-maps - upload a campus map document (base64 data URL: PDF or image)
router.post('/campus-maps', requireRole('operator', 'admin', 'superadmin'), (req, res) => {
  const { kebun, rayon, afdeling, blok, title, file_data_url, mime_type } = req.body || {};
  if (!file_data_url) return res.status(400).json({ error: 'file_data_url required' });
  if (!kebun) return res.status(400).json({ error: 'kebun required' });
  const meta = lookupKebunMeta(kebun);
  const info = db.prepare(`INSERT INTO campus_maps (kebun, region, pt, rayon, afdeling, blok, title, file_data_url, mime_type, uploaded_by)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
    kebun, req.body.region || meta.region, req.body.pt || meta.pt, rayon || null, afdeling || null, blok || null,
    title || `${kebun} ${blok || ''}`.trim(), file_data_url, mime_type || null, req.user.username);
  logAudit({ entity: 'campus_maps', recordId: info.lastInsertRowid, action: 'CREATE', newValue: { kebun, blok, title }, user: req.user.username });
  res.status(201).json({ id: info.lastInsertRowid, ok: true });
});

// DELETE /campus-maps/:id - soft delete (Admin+)
router.delete('/campus-maps/:id', requireRole('admin', 'superadmin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM campus_maps WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE campus_maps SET deleted = 1 WHERE id = ?').run(req.params.id);
  logAudit({ entity: 'campus_maps', recordId: req.params.id, action: 'SOFT_DELETE', user: req.user.username });
  res.json({ ok: true });
});

module.exports = router;
