const express = require('express');
const { db, categorySummary } = require('./db');
const { requireAuth } = require('./auth');

const router = express.Router();
router.use(requireAuth);

// GET /roadmap/summary - aggregated roadmap by type (BRD section 9 + 7)
router.get('/roadmap/summary', (req, res) => {
  const rows = db.prepare('SELECT * FROM roadmap_type_summary ORDER BY no ASC').all();
  const totals = rows.reduce((acc, r) => {
    acc.existing_td2025 += r.existing_td2025; acc.y2026 += r.y2026; acc.y2027 += r.y2027;
    acc.y2028 += r.y2028; acc.y2029 += r.y2029; acc.y2030 += r.y2030;
    acc.total_program += r.total_program; acc.estimasi_2030 += r.estimasi_2030;
    return acc;
  }, { existing_td2025: 0, y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total_program: 0, estimasi_2030: 0 });

  // Progress = buildings whose progress_value >= 100 (completed) among planned roadmap items (BB/BN/AF/BR)
  const planned = db.prepare(`SELECT COUNT(*) c FROM buildings WHERE deleted=0 AND category_code IN ('BN','AF','BR','BB')`).get().c;
  const done = db.prepare(`SELECT COUNT(*) c FROM buildings WHERE deleted=0 AND category_code IN ('BN','AF','BR','BB') AND progress_value >= 100`).get().c;

  res.json({
    by_type: rows,
    totals,
    category_summary: categorySummary,
    progress: { target: planned || totals.total_program, actual: done, percent: planned ? Math.round((done / planned) * 1000) / 10 : null },
  });
});

// GET /roadmap/detail - full sub-type breakdown (Roadmap Detail page in source deck)
router.get('/roadmap/detail', (req, res) => {
  const rows = db.prepare('SELECT * FROM subtype_breakdown ORDER BY building_type, capital').all();
  const grouped = {};
  for (const r of rows) {
    grouped[r.building_type] = grouped[r.building_type] || [];
    grouped[r.building_type].push(r);
  }
  res.json({ grouped, flat: rows });
});

// GET /home - dashboard KPI aggregate (WEB-002)
router.get('/home', (req, res) => {
  const totalsRow = db.prepare(`SELECT
      SUM(existing_td2025) existing, SUM(total_program) rencana, SUM(estimasi_2030) estimasi
      FROM roadmap_type_summary`).get();
  const planned = db.prepare(`SELECT COUNT(*) c FROM buildings WHERE deleted=0 AND category_code IN ('BN','AF','BR','BB')`).get().c;
  const done = db.prepare(`SELECT COUNT(*) c FROM buildings WHERE deleted=0 AND category_code IN ('BN','AF','BR','BB') AND progress_value >= 100`).get().c;
  const alerts = [];
  const missingGps = db.prepare(`SELECT COUNT(*) c FROM buildings WHERE deleted=0 AND (latitude IS NULL OR longitude IS NULL)`).get().c;
  if (missingGps > 0) alerts.push({ type: 'missing_gps', message: `${missingGps} bangunan tanpa koordinat GPS`, severity: 'warning' });
  const failedSync = db.prepare(`SELECT COUNT(*) c FROM sync_queue WHERE status IN ('Failed','Conflict')`).get().c;
  if (failedSync > 0) alerts.push({ type: 'sync_failed', message: `${failedSync} data sync gagal/konflik perlu ditinjau`, severity: 'error' });
  const inconsistent = db.prepare(`SELECT COUNT(*) c FROM roadmap_type_summary WHERE (y2026+y2027+y2028+y2029+y2030) != total_program`).get().c;
  if (inconsistent > 0) alerts.push({ type: 'roadmap_mismatch', message: `${inconsistent} baris roadmap tidak konsisten dengan total tahunan`, severity: 'warning' });

  res.json({
    kpi: {
      existing: totalsRow.existing || 0,
      rencana: totalsRow.rencana || 0,
      estimasi: totalsRow.estimasi || 0,
      progress_unit: done,
      progress_percent: planned ? Math.round((done / planned) * 1000) / 10 : 0,
    },
    category_summary: categorySummary,
    alerts,
  });
});

module.exports = router;
