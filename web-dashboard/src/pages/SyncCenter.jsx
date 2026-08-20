import { useEffect, useState } from 'react';
import api from '../api';

const STATUS_COLOR = {
  Pending: '#94a3b8', Processing: '#0ea5e9', Success: '#16a34a', Failed: '#dc2626', Conflict: '#9333ea', Rejected: '#b45309',
};

export default function SyncCenter() {
  const [data, setData] = useState(null);

  function load() { api.get('/sync/status').then((r) => setData(r.data)); }
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, []);

  async function retry(id) {
    await api.post(`/sync/${id}/retry`);
    load();
  }

  if (!data) return <div className="empty-state">Memuat…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sync Center</h1>
          <p>Status upload dari mobile, failed/conflict queue (WEB-010). Auto-refresh setiap 5 detik.</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        {Object.entries(data.summary).map(([status, count]) => (
          <div className="kpi-tile" key={status}>
            <div className="kpi-label">{status}</div>
            <div className="kpi-value" style={{ color: STATUS_COLOR[status] }}>{count}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="card-title">Antrean Sinkronisasi Terbaru</p>
        <table className="data-table">
          <thead><tr><th>Record UUID</th><th>Entity</th><th>Operation</th><th>Device</th><th>Status</th><th>Waktu</th><th>Error</th><th></th></tr></thead>
          <tbody>
            {data.recent.map((r) => (
              <tr key={r.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.record_uuid?.slice(0, 12)}</td>
                <td>{r.entity}</td><td>{r.operation}</td><td>{r.device}</td>
                <td><span style={{ color: STATUS_COLOR[r.status], fontWeight: 700 }}>{r.status}</span></td>
                <td>{new Date(r.submitted_at).toLocaleString('id-ID')}</td>
                <td style={{ fontSize: 12, color: 'var(--critical)' }}>{r.error || '–'}</td>
                <td>
                  {(r.status === 'Failed' || r.status === 'Conflict') && (
                    <button className="btn btn-sm" onClick={() => retry(r.id)}>Retry / Resolve</button>
                  )}
                </td>
              </tr>
            ))}
            {data.recent.length === 0 && <tr><td colSpan={8}><div className="empty-state">Belum ada aktivitas sinkronisasi. Coba dari aplikasi Mobile.</div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
