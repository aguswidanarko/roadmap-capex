const express = require('express');
const { db } = require('./db');
const { requireAuth } = require('./auth');
const { roadmapTypeSummary } = require('./seedData');
const { buildFilterWhere } = require('./filters');

const router = express.Router();
router.use(requireAuth);

// Canonical 21-item "Jenis Bangunan" taxonomy + display order (from the BRD fixture /
// update spec). Any building_type present in the data but not in this list (a custom type
// introduced by a later import) is appended after it, alphabetically, rather than dropped.
const CANONICAL_JENIS = roadmapTypeSummary.map((r) => r.jenis_bangunan);

function orderedTypes(presentTypes) {
  const extra = [...presentTypes].filter((t) => t && !CANONICAL_JENIS.includes(t)).sort();
  return [...CANONICAL_JENIS, ...extra];
}

// Per jenis_bangunan: count units by kategori pelaksanaan (BN/EX/AF/BR/BB), and derive
//   Existing TD 2025 = EX + AF + BR + BB  (everything that already existed at baseline)
//   Estimasi 2030     = TD2025 + BN - BR  (BB is a like-for-like rebuild -> no net change)
function jenisKategoriTable(query) {
  const { where, params } = buildFilterWhere(query);
  const rows = db.prepare(`
    SELECT building_type,
      SUM(CASE WHEN category_code='BN' THEN 1 ELSE 0 END) bn,
      SUM(CASE WHEN category_code='EX' THEN 1 ELSE 0 END) ex,
      SUM(CASE WHEN category_code='AF' THEN 1 ELSE 0 END) af,
      SUM(CASE WHEN category_code='BR' THEN 1 ELSE 0 END) br,
      SUM(CASE WHEN category_code='BB' THEN 1 ELSE 0 END) bb
    FROM buildings WHERE ${where} GROUP BY building_type
  `).all(...params);

  const byType = new Map(rows.map((r) => [r.building_type, r]));
  const list = orderedTypes(byType.keys()).filter((t) => byType.has(t)).map((jenis, idx) => {
    const r = byType.get(jenis);
    const existing_td2025 = r.ex + r.af + r.br + r.bb;
    const estimasi_2030 = existing_td2025 + r.bn - r.br;
    return { no: idx + 1, id: idx + 1, jenis_bangunan: jenis, existing_td2025, bn: r.bn, ex: r.ex, af: r.af, br: r.br, bb: r.bb, estimasi_2030 };
  });

  const totals = list.reduce((a, r) => ({
    existing_td2025: a.existing_td2025 + r.existing_td2025, bn: a.bn + r.bn, ex: a.ex + r.ex, af: a.af + r.af,
    br: a.br + r.br, bb: a.bb + r.bb, estimasi_2030: a.estimasi_2030 + r.estimasi_2030,
  }), { existing_td2025: 0, bn: 0, ex: 0, af: 0, br: 0, bb: 0, estimasi_2030: 0 });

  return { list, totals };
}

// Program pembangunan per tahun (2026-2030): count of planned units (BN/AF/BR/BB) whose
// roadmap_year falls in that year, grouped by jenis_bangunan.
function programTahunTable(query) {
  const { where, params } = buildFilterWhere(query);
  const rows = db.prepare(`
    SELECT building_type, roadmap_year, COUNT(*) c
    FROM buildings
    WHERE ${where} AND category_code IN ('BN','AF','BR','BB') AND roadmap_year IS NOT NULL
    GROUP BY building_type, roadmap_year
  `).all(...params);

  const byType = new Map();
  for (const r of rows) {
    if (!byType.has(r.building_type)) byType.set(r.building_type, { y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0 });
    const key = `y${r.roadmap_year}`;
    const bucket = byType.get(r.building_type);
    if (key in bucket) bucket[key] = r.c;
  }
  const list = orderedTypes(byType.keys()).filter((t) => byType.has(t)).map((jenis, idx) => {
    const y = byType.get(jenis);
    const total = y.y2026 + y.y2027 + y.y2028 + y.y2029 + y.y2030;
    return { no: idx + 1, id: idx + 1, jenis_bangunan: jenis, ...y, total };
  });
  const totals = list.reduce((a, r) => ({
    y2026: a.y2026 + r.y2026, y2027: a.y2027 + r.y2027, y2028: a.y2028 + r.y2028, y2029: a.y2029 + r.y2029, y2030: a.y2030 + r.y2030, total: a.total + r.total,
  }), { y2026: 0, y2027: 0, y2028: 0, y2029: 0, y2030: 0, total: 0 });
  return { list, totals };
}

function bucketOf(v) {
  if (v >= 100) return 'p100';
  if (v >= 75) return 'p75_99';
  if (v >= 50) return 'p50_75';
  if (v >= 25) return 'p25_50';
  return 'p0_25';
}

// Progress tahun berjalan: for one program year, per jenis: Jlh (unit count under program),
// Biaya (Rp, summed), and Ach(%) bucketed into 0-25/25-50/50-75/75-99/100.
function progressTahunTable(query, year) {
  const { where, params } = buildFilterWhere(query);
  const rows = db.prepare(`
    SELECT building_type, progress_value, biaya
    FROM buildings WHERE ${where} AND category_code IN ('BN','AF','BR','BB') AND roadmap_year = ?
  `).all(...params, year);

  const byType = new Map();
  for (const r of rows) {
    if (!byType.has(r.building_type)) byType.set(r.building_type, { jlh: 0, biaya: 0, p0_25: 0, p25_50: 0, p50_75: 0, p75_99: 0, p100: 0 });
    const t = byType.get(r.building_type);
    t.jlh += 1;
    t.biaya += r.biaya || 0;
    t[bucketOf(r.progress_value || 0)] += 1;
  }
  const list = orderedTypes(byType.keys()).filter((t) => byType.has(t)).map((jenis, idx) => ({ no: idx + 1, id: idx + 1, jenis_bangunan: jenis, ...byType.get(jenis) }));
  const totals = list.reduce((a, r) => ({
    jlh: a.jlh + r.jlh, biaya: a.biaya + r.biaya, p0_25: a.p0_25 + r.p0_25, p25_50: a.p25_50 + r.p25_50,
    p50_75: a.p50_75 + r.p50_75, p75_99: a.p75_99 + r.p75_99, p100: a.p100 + r.p100,
  }), { jlh: 0, biaya: 0, p0_25: 0, p25_50: 0, p50_75: 0, p75_99: 0, p100: 0 });
  return { list, totals };
}

// GET /roadmap/summary - filterable by region/pt/kebun/rayon/afdeling/blok, computed live
// from `buildings` (BRD update: "jumlahnya dapat berubah mengikuti region dan PT yang dipilih").
router.get('/roadmap/summary', (req, res) => {
  const { list, totals } = jenisKategoriTable(req.query);
  const program = programTahunTable(req.query);
  const { where, params } = buildFilterWhere(req.query);
  const planned = db.prepare(`SELECT COUNT(*) c FROM buildings WHERE ${where} AND category_code IN ('BN','AF','BR','BB')`).get(...params).c;
  const done = db.prepare(`SELECT COUNT(*) c FROM buildings WHERE ${where} AND category_code IN ('BN','AF','BR','BB') AND progress_value >= 100`).get(...params).c;

  res.json({
    by_type: list,
    totals,
    program_by_type: program.list,
    program_totals: program.totals,
    category_summary: { BN: totals.bn, EX: totals.ex, AF: totals.af, BR: totals.br, BB: totals.bb },
    progress: { target: planned, actual: done, percent: planned ? Math.round((done / planned) * 1000) / 10 : null },
  });
});

// GET /roadmap/progress-tahun?year=2026 - Jlh/Biaya/Ach% per jenis for the given program year
router.get('/roadmap/progress-tahun', (req, res) => {
  const now = new Date().getFullYear();
  const year = Number(req.query.year) || Math.min(2030, Math.max(2026, now));
  const { list, totals } = progressTahunTable(req.query, year);
  res.json({ year, list, totals });
});

// GET /roadmap/detail - legacy static sub-type breakdown (BRD fixture reference table,
// unchanged by this update — kept for the "Detail per Subjenis" tab).
router.get('/roadmap/detail', (req, res) => {
  const rows = db.prepare('SELECT * FROM subtype_breakdown ORDER BY building_type, capital').all();
  const grouped = {};
  for (const r of rows) {
    grouped[r.building_type] = grouped[r.building_type] || [];
    grouped[r.building_type].push(r);
  }
  res.json({ grouped, flat: rows });
});

// GET /home - dashboard KPI aggregate, filterable by region/pt/kebun, live from `buildings`.
// Progress Pembangunan is split per the update spec:
//   progress_bn_bb: unit BN/BB yang sudah 100% dibagi total unit BN/BB
//   progress_all:   unit APAPUN (termasuk existing) yang sudah 100% dibagi estimasi 2030
router.get('/home', (req, res) => {
  const { where, params } = buildFilterWhere(req.query);
  const { totals } = jenisKategoriTable(req.query);

  const bnbbPlanned = db.prepare(`SELECT COUNT(*) c FROM buildings WHERE ${where} AND category_code IN ('BN','BB')`).get(...params).c;
  const bnbbDone = db.prepare(`SELECT COUNT(*) c FROM buildings WHERE ${where} AND category_code IN ('BN','BB') AND progress_value >= 100`).get(...params).c;
  const allDone = db.prepare(`SELECT COUNT(*) c FROM buildings WHERE ${where} AND progress_value >= 100`).get(...params).c;

  const alerts = [];
  const missingGps = db.prepare(`SELECT COUNT(*) c FROM buildings WHERE ${where} AND (latitude IS NULL OR longitude IS NULL)`).get(...params).c;
  if (missingGps > 0) alerts.push({ type: 'missing_gps', message: `${missingGps} bangunan tanpa koordinat GPS`, severity: 'warning' });
  const failedSync = db.prepare(`SELECT COUNT(*) c FROM sync_queue WHERE status IN ('Failed','Conflict')`).get().c;
  if (failedSync > 0) alerts.push({ type: 'sync_failed', message: `${failedSync} data sync gagal/konflik perlu ditinjau`, severity: 'error' });
  const inconsistent = db.prepare(`SELECT COUNT(*) c FROM roadmap_type_summary WHERE (y2026+y2027+y2028+y2029+y2030) != total_program`).get().c;
  if (inconsistent > 0) alerts.push({ type: 'roadmap_mismatch', message: `${inconsistent} baris roadmap fixture tidak konsisten dengan total tahunan`, severity: 'warning' });

  const rencana = totals.bn + totals.af + totals.br + totals.bb;
  const progressBnBb = { unit: bnbbDone, target: bnbbPlanned, percent: bnbbPlanned ? Math.round((bnbbDone / bnbbPlanned) * 1000) / 10 : 0 };
  const progressAll = { unit: allDone, target: totals.estimasi_2030, percent: totals.estimasi_2030 ? Math.round((allDone / totals.estimasi_2030) * 1000) / 10 : 0 };

  res.json({
    kpi: {
      existing: totals.existing_td2025,
      rencana,
      estimasi: totals.estimasi_2030,
      progress_bn_bb: progressBnBb,
      progress_all: progressAll,
      // legacy fields kept so the mobile app (single progress figure) keeps working unchanged
      progress_unit: allDone,
      progress_percent: progressAll.percent,
    },
    category_summary: { BN: totals.bn, EX: totals.ex, AF: totals.af, BR: totals.br, BB: totals.bb },
    alerts,
  });
});

module.exports = router;
