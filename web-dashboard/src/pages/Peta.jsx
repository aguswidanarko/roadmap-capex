import { useEffect, useState } from 'react';
import api, { CATEGORY_META, CATEGORY_ORDER } from '../api';
import MiniMap from '../components/MiniMap';

export default function Peta() {
  const [buildings, setBuildings] = useState([]);
  const [activeCats, setActiveCats] = useState(new Set(CATEGORY_ORDER));

  useEffect(() => { api.get('/buildings?limit=1000').then((r) => setBuildings(r.data.items)); }, []);

  function toggleCat(code) {
    setActiveCats((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }

  const filtered = buildings.filter((b) => activeCats.has(b.category_code));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Peta Interaktif</h1>
          <p>Marker bangunan berdasarkan koordinat GPS dan kategori pelaksanaan &middot; klik marker untuk detail.</p>
        </div>
      </div>
      <div className="filters-row">
        {CATEGORY_ORDER.map((code) => {
          const meta = CATEGORY_META[code];
          const on = activeCats.has(code);
          return (
            <button
              key={code}
              className="btn btn-sm"
              onClick={() => toggleCat(code)}
              style={{ opacity: on ? 1 : 0.4, borderColor: meta.color, color: on ? meta.color : undefined }}
            >
              <span className="dot" style={{ background: meta.color, display: 'inline-block', marginRight: 6 }} />
              {code} &middot; {meta.label}
            </button>
          );
        })}
      </div>
      <div className="card" style={{ padding: 8 }}>
        <MiniMap buildings={filtered} height={560} />
      </div>
      <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 8 }}>
        Menampilkan {filtered.length} dari {buildings.length} bangunan (lokasi contoh: Pondok 1, Kebun KAL, Rayon A, Afd II).
      </p>
    </div>
  );
}
