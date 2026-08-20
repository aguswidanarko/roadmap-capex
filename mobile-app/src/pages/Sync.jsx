import { useEffect, useState } from 'react';
import MobileShell from '../components/MobileShell';
import { db } from '../db/db';
import { runSync, onSyncChange, isSyncing } from '../db/syncEngine';

export default function Sync() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [lastSync, setLastSync] = useState(localStorage.getItem('capex_last_sync'));

  async function refresh() {
    const b = await db.buildings.where('deleted').notEqual(1).toArray();
    b.sort((a, c) => new Date(c.updated_at || 0) - new Date(a.updated_at || 0));
    setRows(b);
    setBusy(isSyncing());
  }

  useEffect(() => { refresh(); return onSyncChange(refresh); }, []);

  async function handleSync() {
    setBusy(true);
    const res = await runSync({ manual: true });
    if (res.ok) { localStorage.setItem('capex_last_sync', new Date().toISOString()); setLastSync(new Date().toISOString()); }
    else if (res.offline) alert('Tidak ada koneksi internet. Data akan tersinkron otomatis saat online kembali.');
    setBusy(false);
    refresh();
  }

  const pending = rows.filter((r) => r.sync_status === 'Pending').length;
  const failed = rows.filter((r) => r.sync_status === 'Failed').length;
  const conflict = rows.filter((r) => r.sync_status === 'Conflict').length;
  const success = rows.filter((r) => r.sync_status === 'Success').length;

  return (
    <MobileShell title="Sync Center" sub={lastSync ? `Terakhir sync: ${new Date(lastSync).toLocaleString('id-ID')}` : 'Belum pernah sync'}>
      <div className="kpi-grid" style={{ marginBottom: 12 }}>
        <div className="kpi-tile"><div className="kpi-label">Pending</div><div className="kpi-value">{pending}</div></div>
        <div className="kpi-tile"><div className="kpi-label">Failed</div><div className="kpi-value" style={{ color: 'var(--critical)' }}>{failed}</div></div>
        <div className="kpi-tile"><div className="kpi-label">Conflict</div><div className="kpi-value" style={{ color: '#9333ea' }}>{conflict}</div></div>
        <div className="kpi-tile"><div className="kpi-label">Success</div><div className="kpi-value" style={{ color: 'var(--good)' }}>{success}</div></div>
      </div>

      <button className="btn-big btn-primary" onClick={handleSync} disabled={busy}>{busy ? 'Sinkronisasi berjalan…' : '↻ Sync Sekarang'}</button>

      <div className="card" style={{ marginTop: 14 }}>
        <p className="card-title">Antrean Data ({rows.length})</p>
        {rows.length === 0 && <div className="empty-state">Belum ada data lokal.</div>}
        {rows.map((r) => (
          <div className="building-row" key={r.uuid}>
            <div>
              <div className="bname">No. {r.no_unit} &middot; {r.capital}</div>
              <div className="bmeta">{r.last_error || (r.updated_at ? new Date(r.updated_at).toLocaleString('id-ID') : '')}</div>
            </div>
            <span className={`sync-badge sync-${r.sync_status || 'Success'}`}>{r.sync_status || 'Success'}</span>
          </div>
        ))}
      </div>
    </MobileShell>
  );
}
