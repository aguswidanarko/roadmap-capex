import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileShell from '../components/MobileShell';
import CategoryBadge from '../components/CategoryBadge';
import api, { CATEGORY_ORDER } from '../api';
import { db } from '../db/db';

export default function Buildings() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');

  const loadLocal = useCallback(async () => {
    let rows = await db.buildings.where('deleted').notEqual(1).toArray();
    if (cat) rows = rows.filter((r) => r.category_code === cat);
    if (q) rows = rows.filter((r) => `${r.no_unit} ${r.capital}`.toLowerCase().includes(q.toLowerCase()));
    rows.sort((a, b) => (a.no_unit > b.no_unit ? 1 : -1));
    setItems(rows);
  }, [q, cat]);

  useEffect(() => {
    async function sync() {
      if (navigator.onLine) {
        try {
          const res = await api.get('/buildings?limit=1000');
          const tx = db.transaction('rw', db.buildings, async () => {
            for (const b of res.data.items) {
              const local = await db.buildings.get(b.uuid);
              // Don't overwrite a record with unsynced local edits
              if (!local || local.sync_status === 'Success' || !local.sync_status) {
                await db.buildings.put({ ...b, sync_status: 'Success', server_updated_at: b.updated_at });
              }
            }
          });
          await tx;
        } catch { /* offline-tolerant */ }
      }
      loadLocal();
    }
    sync();
  }, [loadLocal]);

  return (
    <MobileShell title="Data Bangunan" sub={`${items.length} record`}>
      <div className="searchbar">
        <input placeholder="Cari No. Unit / Capital…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="filter-chip-row">
        <button className={`filter-chip ${!cat ? 'active' : ''}`} onClick={() => setCat('')}>Semua</button>
        {CATEGORY_ORDER.map((c) => (
          <button key={c} className={`filter-chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="card" style={{ padding: '4px 12px' }}>
        {items.length === 0 && <div className="empty-state">Tidak ada data. Tarik untuk refresh saat online.</div>}
        {items.map((b) => (
          <div className="building-row" key={b.uuid} onClick={() => navigate(`/buildings/${b.uuid}`)}>
            <div>
              <div className="bname">No. {b.no_unit} &middot; {b.capital}</div>
              <div className="bmeta">{b.kebun}/{b.rayon}/{b.afdeling}/{b.blok} &middot; {b.progress_value ?? 0}%</div>
              {(b.region || b.pt) && <div className="bmeta" style={{ opacity: .7 }}>{[b.region, b.pt].filter(Boolean).join(' · ')}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <CategoryBadge code={b.category_code} />
              <div style={{ marginTop: 5 }}><span className={`sync-badge sync-${b.sync_status || 'Success'}`}>{b.sync_status || 'Success'}</span></div>
            </div>
          </div>
        ))}
      </div>

      <button className="fab" onClick={() => navigate('/buildings/new')} aria-label="Tambah Bangunan">+</button>
    </MobileShell>
  );
}
