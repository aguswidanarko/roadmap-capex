import { useEffect, useState, useRef } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useFilters } from '../context/FilterContext';
import RegionPtFilter from '../components/RegionPtFilter';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Foto() {
  const { can } = useAuth();
  const { params, region, pt } = useFilters();
  const [photos, setPhotos] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ kebun: '', blok: '', title: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const isUploader = can('operator', 'admin', 'superadmin');
  const isAdmin = can('admin', 'superadmin');
  const featuredCount = photos.filter((p) => p.featured).length;

  function load() { api.get('/photos/latest', { params: { ...params, limit: 60 } }).then((r) => setPhotos(r.data)); }
  useEffect(() => { load(); }, [region, pt]);
  useEffect(() => { api.get('/master/locations').then((r) => setLocations(r.data)); }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file || !form.kebun) { setError('Kebun dan file foto wajib diisi'); return; }
    setUploading(true); setError('');
    try {
      const data_url = await fileToDataUrl(file);
      await api.post('/photos', { ...form, data_url });
      setForm({ kebun: '', blok: '', title: '' });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload gagal');
    } finally {
      setUploading(false);
    }
  }

  async function toggleFeatured(p) {
    try {
      await api.put(`/photos/${p.id}/feature`, { featured: !p.featured });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal mengubah status unggulan');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus foto ini?')) return;
    await api.delete(`/photos/${id}`);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Foto Bangunan</h1>
          <p>Gallery foto bangunan &middot; admin dapat memilih hingga 8 foto untuk slideshow Dashboard.</p>
        </div>
      </div>

      <RegionPtFilter />

      {isUploader && (
        <div className="card">
          <p className="card-title">Upload Foto</p>
          <form onSubmit={handleUpload} className="form-grid">
            <div>
              <label>Kebun *</label>
              <input list="kebun-list-foto" value={form.kebun} onChange={(e) => setForm({ ...form, kebun: e.target.value })} placeholder="mis. PT. SAM 2" />
              <datalist id="kebun-list-foto">
                {[...new Set(locations.map((l) => l.kebun))].map((k) => <option key={k} value={k} />)}
              </datalist>
            </div>
            <div><label>Blok</label><input value={form.blok} onChange={(e) => setForm({ ...form, blok: e.target.value })} /></div>
            <div className="full"><label>Judul / Keterangan</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="mis. Rumah G4 No. 12" /></div>
            <div className="full">
              <label>File Foto *</label>
              <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0] || null)} />
            </div>
            <div className="full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              {error && <span style={{ color: 'var(--critical)', fontSize: 12.5, alignSelf: 'center' }}>{error}</span>}
              <button className="btn btn-primary" disabled={uploading}>{uploading ? 'Mengunggah…' : 'Upload'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <p className="card-title">{photos.length} Foto {isAdmin && `· ${featuredCount}/8 unggulan slideshow Dashboard`}</p>
        {photos.length === 0 ? (
          <div className="empty-state">Belum ada foto untuk filter ini. Upload lewat form di atas atau aplikasi Mobile.</div>
        ) : (
          <div className="thumb-grid">
            {photos.map((p) => (
              <div className="thumb-card" key={p.id}>
                <div className="thumb-frame"><img src={p.data_url} alt={p.capital || 'Foto bangunan'} /></div>
                <div className="thumb-body">
                  <strong>{p.capital || '–'}</strong>
                  <div className="thumb-meta">{p.kebun} &middot; {p.blok || '–'}</div>
                  <div className="thumb-meta">{new Date(p.captured_at).toLocaleString('id-ID')} &middot; {p.source}</div>
                  {p.featured && <div className="thumb-meta" style={{ color: 'var(--brand)', fontWeight: 700 }}>★ Unggulan Dashboard</div>}
                </div>
                {isAdmin && (
                  <div className="thumb-actions">
                    <button className="btn btn-sm" onClick={() => toggleFeatured(p)} disabled={!p.featured && featuredCount >= 8}>
                      {p.featured ? 'Lepas Unggulan' : 'Jadikan Unggulan'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Hapus</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
