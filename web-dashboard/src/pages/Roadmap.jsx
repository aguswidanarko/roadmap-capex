import { useEffect, useState } from 'react';
import api from '../api';

export default function Roadmap() {
  const [summary, setSummary] = useState(null);
  const [detail, setDetail] = useState(null);
  const [tab, setTab] = useState('rekap');

  useEffect(() => {
    api.get('/roadmap/summary').then((r) => setSummary(r.data));
    api.get('/roadmap/detail').then((r) => setDetail(r.data));
  }, []);

  if (!summary || !detail) return <div className="empty-state">Memuat data…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Roadmap CAPEX Bangunan</h1>
          <p>Rekap per jenis bangunan dan tahun program 2026&ndash;2030, fixture PT. XXX (existing 361, total program 56, estimasi 2030 417).</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'rekap' ? 'active' : ''}`} onClick={() => setTab('rekap')}>Rekap per Jenis</button>
        <button className={`tab ${tab === 'detail' ? 'active' : ''}`} onClick={() => setTab('detail')}>Detail per Subjenis</button>
      </div>

      {tab === 'rekap' && (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr><th>No</th><th>Jenis Bangunan</th><th>Existing TD 2025</th><th>2026</th><th>2027</th><th>2028</th><th>2029</th><th>2030</th><th>Total Program</th><th>Estimasi 2030</th></tr>
            </thead>
            <tbody>
              {summary.by_type.map((r) => (
                <tr key={r.id}>
                  <td>{r.no}</td><td>{r.jenis_bangunan}</td><td>{r.existing_td2025}</td>
                  <td>{r.y2026 || '–'}</td><td>{r.y2027 || '–'}</td><td>{r.y2028 || '–'}</td><td>{r.y2029 || '–'}</td><td>{r.y2030 || '–'}</td>
                  <td>{r.total_program}</td><td>{r.estimasi_2030}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>Total</td><td>{summary.totals.existing_td2025}</td><td>{summary.totals.y2026}</td>
                <td>{summary.totals.y2027}</td><td>{summary.totals.y2028}</td><td>{summary.totals.y2029}</td><td>{summary.totals.y2030}</td>
                <td>{summary.totals.total_program}</td><td>{summary.totals.estimasi_2030}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {tab === 'detail' && (
        <div>
          {Object.entries(detail.grouped).map(([type, rows]) => (
            <div className="card" key={type}>
              <p className="card-title">{type}</p>
              <table className="data-table">
                <thead>
                  <tr><th>Capital / Subjenis</th><th>Existing 2025</th><th>2026</th><th>2027</th><th>2028</th><th>2029</th><th>2030</th><th>Total</th><th>Est. 2030</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.capital}</td><td>{r.ex2025}</td><td>{r.y2026 || '–'}</td><td>{r.y2027 || '–'}</td>
                      <td>{r.y2028 || '–'}</td><td>{r.y2029 || '–'}</td><td>{r.y2030 || '–'}</td><td>{r.total}</td><td>{r.est2030}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
