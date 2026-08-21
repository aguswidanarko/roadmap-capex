const express = require('express');
const crypto = require('crypto');
const { db, logAudit } = require('./db');
const { requireAuth, requireRole } = require('./auth');
const { lookupKebunMeta } = require('./kebunMeta');
const { normalizeJenisBangunan } = require('./jenisBangunanRemap');

const router = express.Router();
router.use(requireAuth);

// POST /sync/batch - batch sync from mobile (MOB-013 / WEB-010)
// Body: { device, records: [{ record_uuid, entity, operation, payload, client_version }] }
router.post('/sync/batch', (req, res) => {
  const { device, records } = req.body || {};
  if (!Array.isArray(records)) return res.status(400).json({ error: 'records[] required' });
  const results = [];
  const tx = db.transaction(() => {
    for (const rec of records) {
      const qStmt = db.prepare(`INSERT INTO sync_queue (record_uuid, entity, operation, payload, status, device, submitted_by)
        VALUES (?,?,?,?,?,?,?)`);
      let status = 'Processing';
      let error = null;
      try {
        if (rec.entity === 'buildings') {
          const p = rec.payload || {};
          const existing = db.prepare('SELECT id FROM buildings WHERE uuid = ?').get(rec.record_uuid);
          if (rec.operation === 'CREATE' || !existing) {
            const meta = lookupKebunMeta(p.kebun);
            const insertStmt = db.prepare(`INSERT INTO buildings
              (uuid, no_unit, kebun, region, pt, rayon, afdeling, blok, capital, building_type, subtype, unit_count, pintu,
               tahun_bangun, category_code, estimasi_capital, estimasi_unit, estimasi_pintu, roadmap_year, biaya, keterangan_af,
               latitude, longitude, accuracy, progress_value, progress_date, progress_note, source, created_by, updated_by)
              VALUES (@uuid,@no_unit,@kebun,@region,@pt,@rayon,@afdeling,@blok,@capital,@building_type,@subtype,@unit_count,@pintu,
               @tahun_bangun,@category_code,@estimasi_capital,@estimasi_unit,@estimasi_pintu,@roadmap_year,@biaya,@keterangan_af,
               @latitude,@longitude,@accuracy,@progress_value,@progress_date,@progress_note,'MOBILE',@created_by,@updated_by)
              ON CONFLICT(uuid) DO NOTHING`);
            insertStmt.run({
              uuid: rec.record_uuid, no_unit: p.no_unit || null, kebun: p.kebun || null,
              region: p.region || meta.region || null, pt: p.pt || meta.pt || null,
              rayon: p.rayon || null, afdeling: p.afdeling || null, blok: p.blok || null, capital: p.capital || null,
              building_type: normalizeJenisBangunan(p.building_type) || null, subtype: p.subtype || null,
              unit_count: p.unit_count ?? 1, pintu: p.pintu ?? 0, tahun_bangun: p.tahun_bangun || null,
              category_code: p.category_code || 'EX', estimasi_capital: p.estimasi_capital || p.capital || null,
              estimasi_unit: p.estimasi_unit ?? p.unit_count ?? 1, estimasi_pintu: p.estimasi_pintu ?? p.pintu ?? 0,
              roadmap_year: p.roadmap_year || null, biaya: p.biaya ?? 0, keterangan_af: p.keterangan_af || null,
              latitude: p.latitude ?? null, longitude: p.longitude ?? null, accuracy: p.accuracy ?? null,
              progress_value: p.progress_value ?? 0, progress_date: p.progress_date || null, progress_note: p.progress_note || null,
              created_by: rec.user || device || 'mobile', updated_by: rec.user || device || 'mobile',
            });
          } else {
            // Conflict rule: version-based. If client_version is stale vs server updated_at, flag Conflict instead of overwrite.
            const current = db.prepare('SELECT * FROM buildings WHERE uuid = ?').get(rec.record_uuid);
            if (rec.base_updated_at && current.updated_at !== rec.base_updated_at) {
              status = 'Conflict';
              error = 'Server record changed since last sync (version mismatch)';
            } else {
              db.prepare(`UPDATE buildings SET
                no_unit=@no_unit, capital=@capital, building_type=@building_type, unit_count=@unit_count, pintu=@pintu,
                category_code=@category_code, roadmap_year=@roadmap_year, latitude=@latitude, longitude=@longitude, accuracy=@accuracy,
                progress_value=@progress_value, progress_date=@progress_date, progress_note=@progress_note,
                updated_by=@updated_by, updated_at=datetime('now')
                WHERE uuid=@uuid`).run({ ...p, building_type: normalizeJenisBangunan(p.building_type), uuid: rec.record_uuid, updated_by: rec.user || device || 'mobile' });
            }
          }
          if (status !== 'Conflict') {
            status = 'Success';
            logAudit({ entity: 'buildings', recordId: rec.record_uuid, action: rec.operation || 'CREATE', newValue: p, user: rec.user || device, source: 'MOBILE' });
          }
        } else if (rec.entity === 'photos') {
          const p = rec.payload || {};
          const building = db.prepare('SELECT id, kebun, region, pt, blok FROM buildings WHERE uuid = ?').get(p.building_uuid);
          if (!building) { status = 'Failed'; error = 'Referenced building not found on server'; }
          else {
            db.prepare(`INSERT INTO photos (building_id, kebun, region, pt, blok, data_url, latitude, longitude, uploaded_by, source)
              VALUES (?,?,?,?,?,?,?,?,?,'MOBILE')`)
              .run(building.id, building.kebun, building.region, building.pt, building.blok,
                p.data_url, p.latitude || null, p.longitude || null, rec.user || device || 'mobile');
            status = 'Success';
          }
        } else {
          status = 'Rejected'; error = `Unknown entity: ${rec.entity}`;
        }
      } catch (e) {
        status = 'Failed'; error = e.message;
      }
      qStmt.run(rec.record_uuid, rec.entity, rec.operation, JSON.stringify(rec.payload || {}), status, device || 'unknown', rec.user || device || 'mobile');
      db.prepare(`UPDATE sync_queue SET status=?, error=?, processed_at=datetime('now') WHERE id = last_insert_rowid()`).run(status, error);
      results.push({ record_uuid: rec.record_uuid, status, error });
    }
  });
  tx();
  res.json({ device, processed: results.length, results });
});

// GET /sync/status - overall + queue listing (WEB-010, Sync Center)
router.get('/sync/status', (req, res) => {
  const counts = db.prepare(`SELECT status, COUNT(*) c FROM sync_queue GROUP BY status`).all();
  const summary = { Pending: 0, Processing: 0, Success: 0, Failed: 0, Conflict: 0, Rejected: 0 };
  for (const row of counts) summary[row.status] = row.c;
  const recent = db.prepare(`SELECT * FROM sync_queue ORDER BY submitted_at DESC LIMIT 100`).all();
  res.json({ summary, recent });
});

// POST /sync/:id/retry - operator/admin retries a failed/conflict item
router.post('/sync/:id/retry', requireRole('operator', 'admin', 'superadmin'), (req, res) => {
  const item = db.prepare('SELECT * FROM sync_queue WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  db.prepare(`UPDATE sync_queue SET status='Success', error=NULL, processed_at=datetime('now') WHERE id=?`).run(req.params.id);
  logAudit({ entity: 'sync_queue', recordId: req.params.id, action: 'RETRY_RESOLVED', user: req.user.username });
  res.json({ ok: true });
});

module.exports = router;
