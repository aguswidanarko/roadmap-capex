const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { db, categorySummary } = require('./db');
const { requireAuth } = require('./auth');

const router = express.Router();
router.use(requireAuth);

function applyFilters(req) {
  const { kebun, rayon, afdeling, blok, category_code, building_type } = req.query;
  let sql = 'SELECT * FROM buildings WHERE deleted = 0';
  const params = [];
  if (kebun) { sql += ' AND kebun = ?'; params.push(kebun); }
  if (rayon) { sql += ' AND rayon = ?'; params.push(rayon); }
  if (afdeling) { sql += ' AND afdeling = ?'; params.push(afdeling); }
  if (blok) { sql += ' AND blok = ?'; params.push(blok); }
  if (category_code) { sql += ' AND category_code = ?'; params.push(category_code); }
  if (building_type) { sql += ' AND building_type = ?'; params.push(building_type); }
  return db.prepare(sql).all(...params);
}

// GET /reports/roadmap-detail.xlsx  (BRD 15: Reporting & Export - numeric values preserved)
router.get('/reports/roadmap-detail.xlsx', async (req, res) => {
  const rows = db.prepare('SELECT * FROM roadmap_type_summary ORDER BY no').all();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Roadmap CAPEX Dashboard';
  const ws = wb.addWorksheet('Roadmap Detail');
  ws.addRow(['Roadmap CAPEX Bangunan']);
  ws.addRow([`Periode filter: 2026-2030`, `Generated: ${new Date().toISOString()}`, `User: ${req.user.username}`]);
  ws.addRow([]);
  ws.addRow(['No', 'Jenis Bangunan', 'Existing TD 2025', '2026', '2027', '2028', '2029', '2030', 'Total Program', 'Estimasi 2030']);
  rows.forEach(r => ws.addRow([r.no, r.jenis_bangunan, r.existing_td2025, r.y2026, r.y2027, r.y2028, r.y2029, r.y2030, r.total_program, r.estimasi_2030]));
  const totalsRow = ws.addRow(['', 'TOTAL',
    rows.reduce((s, r) => s + r.existing_td2025, 0), rows.reduce((s, r) => s + r.y2026, 0), rows.reduce((s, r) => s + r.y2027, 0),
    rows.reduce((s, r) => s + r.y2028, 0), rows.reduce((s, r) => s + r.y2029, 0), rows.reduce((s, r) => s + r.y2030, 0),
    rows.reduce((s, r) => s + r.total_program, 0), rows.reduce((s, r) => s + r.estimasi_2030, 0)]);
  totalsRow.font = { bold: true };
  ws.getRow(4).font = { bold: true };
  ws.columns.forEach(c => { c.width = 18; });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="roadmap-detail.xlsx"');
  await wb.xlsx.write(res);
  res.end();
});

// GET /reports/buildings.xlsx - Building Detail export (filtered)
router.get('/reports/buildings.xlsx', async (req, res) => {
  const rows = applyFilters(req);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Building Detail');
  ws.addRow(['Building Detail Report']);
  ws.addRow([`Filter: ${JSON.stringify(req.query)}`, `Generated: ${new Date().toISOString()}`, `User: ${req.user.username}`]);
  ws.addRow([]);
  const header = ['No Unit', 'Kebun', 'Rayon', 'Afd', 'Blok', 'Capital', 'Jenis', 'Unit', 'Pintu', 'Tahun Bangun', 'Kategori', 'Roadmap Tahun', 'Estimasi Unit', 'Progress %', 'Latitude', 'Longitude'];
  ws.addRow(header).font = { bold: true };
  rows.forEach(r => ws.addRow([r.no_unit, r.kebun, r.rayon, r.afdeling, r.blok, r.capital, r.building_type, r.unit_count, r.pintu, r.tahun_bangun, r.category_code, r.roadmap_year, r.estimasi_unit, r.progress_value, r.latitude, r.longitude]));
  ws.columns.forEach(c => { c.width = 14; });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="building-detail.xlsx"');
  await wb.xlsx.write(res);
  res.end();
});

// GET /reports/roadmap-summary.pdf - PDF with header per BRD 15
router.get('/reports/roadmap-summary.pdf', (req, res) => {
  const rows = db.prepare('SELECT * FROM roadmap_type_summary ORDER BY no').all();
  const totals = rows.reduce((a, r) => ({
    existing: a.existing + r.existing_td2025, program: a.program + r.total_program, estimasi: a.estimasi + r.estimasi_2030,
  }), { existing: 0, program: 0, estimasi: 0 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="roadmap-summary.pdf"');
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);
  doc.fontSize(16).text('PT. XXX - Roadmap CAPEX Bangunan', { align: 'left' });
  doc.fontSize(9).fillColor('#555').text(`Periode: 2026-2030   |   Tanggal generate: ${new Date().toLocaleString('id-ID')}   |   User: ${req.user.username}`);
  doc.moveDown(1);
  doc.fillColor('#000').fontSize(11).text(`Existing TD 2025: ${totals.existing}    Total Program 2026-2030: ${totals.program}    Estimasi 2030: ${totals.estimasi}`);
  doc.moveDown(1);
  const colX = [40, 200, 280, 330, 380, 430, 480, 520];
  const headers = ['Jenis Bangunan', 'Exist.2025', '2026', '2027', '2028', '2029', '2030', 'Est.2030'];
  doc.fontSize(9).font('Helvetica-Bold');
  headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { continued: i < headers.length - 1, width: 60 }));
  doc.moveDown(0.5);
  doc.font('Helvetica');
  rows.forEach(r => {
    const y = doc.y;
    doc.text(r.jenis_bangunan, colX[0], y, { width: 155 });
    doc.text(String(r.existing_td2025), colX[1], y);
    doc.text(String(r.y2026), colX[2], y);
    doc.text(String(r.y2027), colX[3], y);
    doc.text(String(r.y2028), colX[4], y);
    doc.text(String(r.y2029), colX[5], y);
    doc.text(String(r.y2030), colX[6], y);
    doc.text(String(r.estimasi_2030), colX[7], y);
    doc.moveDown(0.6);
  });
  doc.end();
});

// GET /reports/audit.xlsx
router.get('/reports/audit.xlsx', async (req, res) => {
  const rows = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 1000').all();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Audit Log');
  ws.addRow(['Entity', 'Record ID', 'Action', 'User', 'Source', 'Timestamp', 'Old Value', 'New Value']).font = { bold: true };
  rows.forEach(r => ws.addRow([r.entity, r.record_id, r.action, r.user, r.source, r.created_at, r.old_value, r.new_value]));
  ws.columns.forEach(c => { c.width = 20; });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="audit-log.xlsx"');
  await wb.xlsx.write(res);
  res.end();
});

module.exports = router;
