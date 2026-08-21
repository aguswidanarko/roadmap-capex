import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../api';

export default function MasterData() {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState('');

  function loadBatches() { api.get('/master/import-batches').then((r) => setBatches(r.data)); }
  useEffect(() => { loadBatches(); }, []);

  function downloadTemplate() {
    const sample = [{
      region: 'Region Kalbar', pt: 'PT. XXX', kebun: 'KAL', rayon: 'A', afdeling: 'II', blok: 'B44B', no_unit: '64', capital: 'Rumah G4', building_type: 'Rumah',
      unit_count: 1, pintu: 4, tahun_bangun: 2026, category_code: 'BN', roadmap_year: 2026, biaya: 250000000, estimasi_unit: 1, estimasi_pintu: 4,
      latitude: -0.8412, longitude: 115.8805, progress_value: 0, progress_date: '', progress_note: '',
    }];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template-master-bangunan.xlsx');
  }

  async function handleUpload(e) {
    e.preventDefault();
    const file = fileRef.current.files[0];
    if (!file) return;
    setUploading(true); setError(''); setPreview(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/master/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPreview(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload gagal');
    } finally {
      setUploading(false);
    }
  }

  async function handleCommit() {
    if (!preview) return;
    setCommitting(true);
    try {
      const res = await api.post(`/master/import/${preview.batch_id}/commit`);
      alert(`Import berhasil: ${res.data.committed} baris ditambahkan ke Data Bangunan.`);
      setPreview(null);
      fileRef.current.value = '';
      loadBatches();
    } catch (err) {
      alert(err.response?.data?.error || 'Commit gagal');
    } finally {
      setCommitting(false);
    }
  }

  function downloadErrorReport() {
    if (!preview) return;
    const invalidRows = preview.preview.filter((r) => !r.valid).map((r) => ({ row: r.rowNumber, errors: r.errors.join('; '), ...r.data }));
    const ws = XLSX.utils.json_to_sheet(invalidRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Errors');
    XLSX.writeFile(wb, `error-report-${preview.batch_id.slice(0, 8)}.xlsx`);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Master Data Upload</h1>
          <p>Upload XLSX/CSV dengan template resmi &middot; sistem melakukan pre-validation sebelum commit (WEB-008).</p>
        </div>
        <button className="btn" onClick={downloadTemplate}>⬇ Download Template</button>
      </div>

      <div className="card">
        <form onSubmit={handleUpload} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" />
          <button className="btn btn-primary" disabled={uploading}>{uploading ? 'Mengunggah…' : 'Upload & Preview'}</button>
        </form>
        {error && <div className="login-error" style={{ marginTop: 12 }}>{error}</div>}
      </div>

      {preview && (
        <div className="card">
          <p className="card-title">Preview: {preview.filename}</p>
          <div className="grid grid-4" style={{ marginBottom: 14 }}>
            <div className="kpi-tile"><div className="kpi-label">Total Row</div><div className="kpi-value">{preview.total_rows}</div></div>
            <div className="kpi-tile"><div className="kpi-label">Valid</div><div className="kpi-value" style={{ color: 'var(--good)' }}>{preview.valid_rows}</div></div>
            <div className="kpi-tile"><div className="kpi-label">Invalid</div><div className="kpi-value" style={{ color: 'var(--critical)' }}>{preview.invalid_rows}</div></div>
            <div className="kpi-tile"><div className="kpi-label">Duplicate</div><div className="kpi-value" style={{ color: 'var(--warning)' }}>{preview.duplicate_rows}</div></div>
          </div>
          <table className="data-table">
            <thead><tr><th>Row</th><th>No Unit</th><th>Kategori</th><th>Status</th><th>Error</th></tr></thead>
            <tbody>
              {preview.preview.map((r) => (
                <tr key={r.rowNumber}>
                  <td>{r.rowNumber}</td>
                  <td>{r.data.no_unit || r.data['No Unit'] || '–'}</td>
                  <td>{r.category_code || '–'}</td>
                  <td style={{ color: r.valid ? 'var(--good)' : 'var(--critical)', fontWeight: 700 }}>{r.valid ? 'Valid' : 'Invalid'}</td>
                  <td style={{ fontSize: 12 }}>{r.errors.join('; ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="modal-actions" style={{ marginTop: 14 }}>
            {preview.invalid_rows > 0 && <button className="btn" onClick={downloadErrorReport}>⬇ Download Error Report</button>}
            <button className="btn btn-primary" disabled={committing || preview.valid_rows === 0} onClick={handleCommit}>
              {committing ? 'Menyimpan…' : `Commit ${preview.valid_rows} baris valid`}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <p className="card-title">Riwayat Import (Batch ID)</p>
        <table className="data-table">
          <thead><tr><th>Batch ID</th><th>File</th><th>Total</th><th>Valid</th><th>Invalid</th><th>Status</th><th>Waktu</th></tr></thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{b.batch_id.slice(0, 8)}</td>
                <td>{b.filename}</td><td>{b.total_rows}</td><td>{b.valid_rows}</td><td>{b.invalid_rows}</td>
                <td>{b.status}</td><td>{new Date(b.uploaded_at).toLocaleString('id-ID')}</td>
              </tr>
            ))}
            {batches.length === 0 && <tr><td colSpan={7}><div className="empty-state">Belum ada riwayat import.</div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
