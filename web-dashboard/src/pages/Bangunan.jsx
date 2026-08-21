import { useEffect, useState, useCallback } from 'react';
import api, { CATEGORY_ORDER } from '../api';
import CategoryBadge from '../components/CategoryBadge';
import { useAuth } from '../context/AuthContext';
import { useFilters } from '../context/FilterContext';
import RegionPtFilter from '../components/RegionPtFilter';
import BuildingModal from '../components/BuildingModal';

export default function Bangunan() {
  const { can } = useAuth();
  const { params, region, pt } = useFilters();
  const [home, setHome] = useState(null);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [types, setTypes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    const p = { ...params };
    if (q) p.q = q;
    if (category) p.category_code = category;
    if (type) p.building_type = type;
    api.get('/buildings', { params: p }).then((r) => setItems(r.data.items));
  }, [q, category, type, region, pt]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/master/building-types').then((r) => setTypes(r.data)); }, []);
  useEffect(() => { api.get('/home', { params }).then((r) => setHome(r.data)); }, [region, pt]);

  async function handleDelete(id) {
    if (!confirm('Hapus (soft-delete) data bangunan ini?')) return;
    await api.delete(`/buildings/${id}`);
    load();
  }

  const isAdmin = can('admin', 'superadmin');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Data Bangunan</h1>
          <p>Data detail existing/roadmap per bangunan &middot; {items.length} record.</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>+ Tambah Bangunan</button>}
      </div>

      <RegionPtFilter />

      {home && (
        <div className="grid grid-5" style={{ marginBottom: 16 }}>
          <div className="kpi-tile">
            <div className="kpi-label">Existing (TD 2025)</div>
            <div className="kpi-value">{home.kpi.existing.toLocaleString('id-ID')}</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">Rencana 2026&ndash;2030</div>
            <div className="kpi-value">{home.kpi.rencana.toLocaleString('id-ID')}</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">Estimasi 2030</div>
            <div className="kpi-value">{home.kpi.estimasi.toLocaleString('id-ID')}</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">Progress BN &amp; BB</div>
            <div className="kpi-value">{home.kpi.progress_bn_bb.unit} unit</div>
            <div className="kpi-sub">{home.kpi.progress_bn_bb.percent}%</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">Progress All</div>
            <div className="kpi-value">{home.kpi.progress_all.unit} unit</div>
            <div className="kpi-sub">{home.kpi.progress_all.percent}%</div>
          </div>
        </div>
      )}

      <div className="filters-row">
        <input type="search" placeholder="Cari No. Unit / Capital…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Semua Kategori</option>
          {CATEGORY_ORDER.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Semua Jenis</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>No. Unit</th><th>Region / PT</th><th>Lokasi</th><th>Capital</th><th>Unit/Pintu</th><th>Tahun</th>
                <th>Kategori</th><th>Progress</th>{isAdmin && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id}>
                  <td>{b.no_unit}</td>
                  <td style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>{b.region || '–'}<br />{b.pt || '–'}</td>
                  <td>{b.kebun}/{b.rayon}/{b.afdeling}/{b.blok}</td>
                  <td>{b.capital}</td>
                  <td>{b.unit_count} / {b.pintu}</td>
                  <td>{b.tahun_bangun || '–'}</td>
                  <td><CategoryBadge code={b.category_code} /></td>
                  <td>{b.progress_value}%</td>
                  {isAdmin && (
                    <td>
                      <button className="btn btn-sm" onClick={() => { setEditing(b); setModalOpen(true); }}>Edit</button>{' '}
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b.id)}>Hapus</button>
                    </td>
                  )}
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={isAdmin ? 9 : 8}><div className="empty-state">Tidak ada data yang cocok dengan filter.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <BuildingModal
          building={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}
