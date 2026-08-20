import { useEffect, useState, useCallback } from 'react';
import api, { CATEGORY_ORDER } from '../api';
import CategoryBadge from '../components/CategoryBadge';
import { useAuth } from '../context/AuthContext';
import BuildingModal from '../components/BuildingModal';

export default function Bangunan() {
  const { can } = useAuth();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [types, setTypes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    const params = {};
    if (q) params.q = q;
    if (category) params.category_code = category;
    if (type) params.building_type = type;
    api.get('/buildings', { params }).then((r) => setItems(r.data.items));
  }, [q, category, type]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/master/building-types').then((r) => setTypes(r.data)); }, []);

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
        <table className="data-table">
          <thead>
            <tr>
              <th>No. Unit</th><th>Lokasi</th><th>Capital</th><th>Unit/Pintu</th><th>Tahun</th>
              <th>Kategori</th><th>Progress</th>{isAdmin && <th>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id}>
                <td>{b.no_unit}</td>
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
              <tr><td colSpan={isAdmin ? 8 : 7}><div className="empty-state">Tidak ada data yang cocok dengan filter.</div></td></tr>
            )}
          </tbody>
        </table>
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
