import { useEffect, useState } from 'react';
import api from '../api';

export default function Foto() {
  const [photos, setPhotos] = useState([]);
  useEffect(() => { api.get('/photos/latest?limit=48').then((r) => setPhotos(r.data)); }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Foto Bangunan</h1>
          <p>Gallery foto terbaru dan histori foto dengan metadata tanggal, user, dan koordinat.</p>
        </div>
      </div>
      <div className="card">
        {photos.length === 0 ? (
          <div className="empty-state">Belum ada foto. Foto akan muncul di sini setelah diunggah dari halaman Bangunan atau aplikasi Mobile.</div>
        ) : (
          <div className="photo-grid">
            {photos.map((p) => (
              <div key={p.id}>
                <div className="photo-tile"><img src={p.data_url} alt={p.capital} /></div>
                <div style={{ fontSize: 11, color: 'var(--ink-secondary)', marginTop: 4 }}>
                  {p.capital} &middot; {p.category_code}<br />
                  {new Date(p.captured_at).toLocaleString('id-ID')} &middot; {p.source}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
