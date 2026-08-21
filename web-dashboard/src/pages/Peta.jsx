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

function openDataUrl(dataUrl, mime) {
  try {
    const [, base64] = dataUrl.split(',');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime || 'application/octet-stream' });
    window.open(URL.createObjectURL(blob), '_blank');
  } catch {
    window.open(dataUrl, '_blank');
  }
}

export default function Peta() {
  const { can } = useAuth();
  const { params, region, pt } = useFilters();
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ kebun: '', rayon: '', afdeling: '', blok: '', title: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const isUploader = can('operator', 'admin', 'superadmin');

  function load() { api.get('/campus-maps', { params }).then((r) => setItems(r.data)); }
  useEffect(() => { load(); }, [region, pt]);
  useEffect(() => { api.get('/master/locations').then((r) => setLocations(r.data)); }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file || !form.kebun) { setError('Kebun dan file peta wajib diisi'); return; }
    setUploading(true); setError('');
    try {
      const file_data_url = await fileToDataUrl(file);
      await api.post('/campus-maps', { ...form, file_data_url, mime_type: file.type });
      setForm({ kebun: '', rayon: '', afdeling: '', blok: '', title: '' });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload gagal');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus peta kampus ini?')) return;
    await api.delete(`/campus-maps/${id}`);
    load();
  }

  async function handleView(id, mime) {
    const r = await api.get(`/campus-maps/${id}`);
    openDataUrl(r.data.file_data_url, mime);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Peta Kampus</h1>
          <p>Daftar peta kampus (per Kebun/Rayon/Afdeling/Blok) yang dapat diunggah oleh user maupun admin.</p>
        </div>
      </div>

      <RegionPtFilter />

      {isUploader && (
        <div className="card">
          <p className="card-title">Upload Peta Kampus</p>
          <form onSubmit={handleUpload} className="form-grid">
            <div>
              <label>Kebun *</label>
              <input list="kebun-list" value={form.kebun} onChange={(e) => setForm({ ...form, kebun: e.target.value })} placeholder="mis. PT. SAM 2" />
              <datalist id="kebun-list">
                {[...new Set(locations.map((l) => l.kebun))].map((k) => <option key={k} value={k} />)}
              </datalist>
            </div>
            <div><label>Rayon</label><input value={form.rayon} onChange={(e) => setForm({ ...form, rayon: e.target.value })} /></div>
            <div><label>Afdeling</label><input value={form.afdeling} onChange={(e) => setForm({ ...form, afdeling: e.target.value })} /></div>
            <div><label>Blok</label><input value={form.blok} onChange={(e) => setForm({ ...form, blok: e.target.value })} /></div>
            <div className="full"><label>Judul</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="mis. Peta Kampus Blok D49" /></div>
            <div className="full">
              <label>File Peta (PDF / gambar) *</label>
              <input ref={fileRef} type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files[0] || null)} />
            </div>
            <div className="full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              {error && <span style={{ color: 'var(--critical)', fontSize: 12.5, alignSelf: 'center' }}>{error}</span>}
              <button className="btn btn-primary" disabled={uploading}>{uploading ? 'Mengunggah…' : 'Upload'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <p className="card-title">{items.length} Peta Kampus</p>
        {items.length === 0 ? (
          <div className="empty-state">Belum ada peta kampus untuk filter ini. Unggah lewat form di atas.</div>
        ) : (
          <div className="thumb-grid">
            {items.map((m) => (
              <div className="thumb-card" key={m.id}>
                <div className="thumb-frame" onClick={() => handleView(m.id, m.mime_type)} style={{ cursor: 'pointer' }}>
                  <span className="slideshow-doc-icon">{m.mime_type?.startsWith('image') ? '🖼' : '🗺'}</span>
                </div>
                <div className="thumb-body">
                  <strong>{m.title || `${m.kebun} ${m.blok || ''}`}</strong>
                  <div className="thumb-meta">{m.kebun} &middot; {m.rayon}/{m.afdeling}/{m.blok}</div>
                  <div className="thumb-meta">{m.pt} &middot; {m.region}</div>
                  <div className="thumb-meta">{new Date(m.uploaded_at).toLocaleDateString('id-ID')} &middot; {m.uploaded_by}</div>
                </div>
                <div className="thumb-actions">
                  <button className="btn btn-sm" onClick={() => handleView(m.id, m.mime_type)}>Lihat</button>
                  {can('admin', 'superadmin') && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m.id)}>Hapus</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
