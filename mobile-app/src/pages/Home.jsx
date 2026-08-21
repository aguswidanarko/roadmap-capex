import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileShell from '../components/MobileShell';
import api, { CATEGORY_META, CATEGORY_ORDER } from '../api';
import { useAuth } from '../context/AuthContext';
import { getMaster, setMaster, db } from '../db/db';
import { runSync } from '../db/syncEngine';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [home, setHome] = useState(null);
  const [localCount, setLocalCount] = useState(0);

  useEffect(() => {
    async function load() {
      db.buildings.where('sync_status').notEqual('Success').count().then(setLocalCount);
      if (navigator.onLine) {
        try {
          const res = await api.get('/home');
          setHome(res.data);
          await setMaster('home_kpi', res.data);
          runSync();
          return;
        } catch { /* fall through to cache */ }
      }
      const cached = await getMaster('home_kpi');
      setHome(cached);
    }
    load();
  }, []);

  return (
    <MobileShell title="Roadmap CAPEX" sub={`Halo, ${user?.full_name || user?.username}`}>
      {!home ? (
        <div className="empty-state">Belum ada data ter-cache. Sambungkan internet untuk sinkronisasi awal.</div>
      ) : (
        <>
          <div className="kpi-grid" style={{ marginBottom: 12 }}>
            <div className="kpi-tile"><div className="kpi-label">Existing</div><div className="kpi-value">{home.kpi.existing}</div></div>
            <div className="kpi-tile"><div className="kpi-label">Rencana</div><div className="kpi-value">{home.kpi.rencana}</div></div>
            <div className="kpi-tile"><div className="kpi-label">Estimasi 2030</div><div className="kpi-value">{home.kpi.estimasi}</div></div>
            <div className="kpi-tile"><div className="kpi-label">Progress All</div><div className="kpi-value">{home.kpi.progress_all?.percent ?? home.kpi.progress_percent}%</div></div>
            {home.kpi.progress_bn_bb && (
              <div className="kpi-tile"><div className="kpi-label">Progress BN &amp; BB</div><div className="kpi-value">{home.kpi.progress_bn_bb.percent}%</div></div>
            )}
          </div>

          <div className="card">
            <p className="card-title">Kategori Pelaksanaan</p>
            {CATEGORY_ORDER.map((code) => (
              <div key={code} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                <span className="badge" style={{ background: CATEGORY_META[code].color + '1c', color: CATEGORY_META[code].color }}>
                  <span className="dot" style={{ background: CATEGORY_META[code].color }} /> {code} &middot; {CATEGORY_META[code].label}
                </span>
                <strong>{home.category_summary[code] || 0} unit</strong>
              </div>
            ))}
          </div>

          {home.alerts?.length > 0 && (
            <div className="card">
              <p className="card-title">Alert</p>
              {home.alerts.map((a, i) => <div key={i} style={{ fontSize: 12.5, marginBottom: 6 }}>⚠ {a.message}</div>)}
            </div>
          )}
        </>
      )}

      {localCount > 0 && (
        <div className="card" style={{ borderColor: '#fde68a', background: '#fffbeb' }}>
          <p className="card-title" style={{ color: '#92400e' }}>Draft Lokal Belum Sync</p>
          <p style={{ fontSize: 13, marginBottom: 10 }}>{localCount} data bangunan tersimpan di perangkat ini dan menunggu upload ke server.</p>
          <button className="btn-big btn-secondary" onClick={() => navigate('/sync')}>Lihat Sync Center</button>
        </div>
      )}

      <button className="btn-big btn-primary" style={{ marginTop: 4 }} onClick={() => navigate('/buildings/new')}>
        + Tambah Bangunan
      </button>
    </MobileShell>
  );
}
