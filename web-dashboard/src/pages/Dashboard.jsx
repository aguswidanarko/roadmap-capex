import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import api, { CATEGORY_META, CATEGORY_ORDER } from '../api';
import CategoryBadge from '../components/CategoryBadge';
import MiniMap from '../components/MiniMap';

const ICONS = {
  Rumah: '🏠', Mess: '🏢', Kantor: '🏛', Gudang: '📦', Traksi: '🚜', 'Rumah Ibadah': '🕌',
  Sekolah: '🏫', 'Fasilitas Kesehatan': '⛑', 'Fasilitas Anak': '🧒', 'Fasilitas Olahraga': '⚽',
  'Fasilitas Kantor': '🗂', 'Fasilitas Koperasi': '🛒', 'Instalasi Listrik': '⚡', 'Instalasi Air Bersih': '🚰',
};

export default function Dashboard() {
  const [home, setHome] = useState(null);
  const [summary, setSummary] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [buildings, setBuildings] = useState([]);

  useEffect(() => {
    api.get('/home').then((r) => setHome(r.data));
    api.get('/roadmap/summary').then((r) => setSummary(r.data));
    api.get('/photos/latest?limit=6').then((r) => setPhotos(r.data));
    api.get('/buildings?limit=500').then((r) => setBuildings(r.data.items));
  }, []);

  if (!home || !summary) return <div className="empty-state">Memuat data…</div>;

  const catData = CATEGORY_ORDER.map((code) => ({ code, label: CATEGORY_META[code].label, value: summary.category_summary[code] || 0, color: CATEGORY_META[code].color }));

  return (
    <div>
      {home.alerts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {home.alerts.map((a, i) => (
            <div key={i} className={`alert alert-${a.severity === 'error' ? 'error' : 'warning'}`}>
              <strong>{a.severity === 'error' ? '⚠' : 'ⓘ'}</strong> {a.message}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-4">
        <div className="kpi-tile">
          <div className="kpi-label">Existing (TD 2025)</div>
          <div className="kpi-value">{home.kpi.existing.toLocaleString('id-ID')}</div>
          <div className="kpi-sub">unit baseline</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Rencana 2026&ndash;2030</div>
          <div className="kpi-value">{home.kpi.rencana.toLocaleString('id-ID')}</div>
          <div className="kpi-sub">total program pembangunan</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Estimasi 2030</div>
          <div className="kpi-value">{home.kpi.estimasi.toLocaleString('id-ID')}</div>
          <div className="kpi-sub">proyeksi akhir project</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Progress Pembangunan</div>
          <div className="kpi-value">{home.kpi.progress_unit} unit</div>
          <div className="kpi-sub">{home.kpi.progress_percent}% dari program berjalan</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16, alignItems: 'stretch' }}>
        <div className="card">
          <p className="card-title">Category Summary (Kategori Pelaksanaan)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={catData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="code" width={36} tick={{ fontSize: 12, fontWeight: 700 }} />
              <Tooltip formatter={(v, n, p) => [`${v} unit`, p.payload.label]} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                {catData.map((d) => <Cell key={d.code} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="legend-row" style={{ marginTop: 6 }}>
            {catData.map((d) => (
              <span className="legend-item" key={d.code}><span className="dot" style={{ background: d.color }} />{d.code} {d.label}</span>
            ))}
          </div>
        </div>

        <div className="card">
          <p className="card-title">Map Snapshot &middot; Pondok 1 (Rayon A Afd II)</p>
          <MiniMap buildings={buildings} height={220} />
        </div>
      </div>

      <div className="card">
        <p className="card-title">Roadmap by Type (2026&ndash;2030)</p>
        <table className="data-table">
          <thead>
            <tr>
              <th>Jenis Bangunan</th><th>Existing TD 2025</th><th>2026</th><th>2027</th><th>2028</th><th>2029</th><th>2030</th><th>Total Program</th><th>Estimasi 2030</th>
            </tr>
          </thead>
          <tbody>
            {summary.by_type.map((r) => (
              <tr key={r.id}>
                <td>{ICONS[r.jenis_bangunan] || '🏗'} {r.jenis_bangunan}</td>
                <td>{r.existing_td2025}</td><td>{r.y2026 || '–'}</td><td>{r.y2027 || '–'}</td><td>{r.y2028 || '–'}</td>
                <td>{r.y2029 || '–'}</td><td>{r.y2030 || '–'}</td><td>{r.total_program}</td><td>{r.estimasi_2030}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td><td>{summary.totals.existing_td2025}</td><td>{summary.totals.y2026}</td><td>{summary.totals.y2027}</td>
              <td>{summary.totals.y2028}</td><td>{summary.totals.y2029}</td><td>{summary.totals.y2030}</td>
              <td>{summary.totals.total_program}</td><td>{summary.totals.estimasi_2030}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="card">
        <p className="card-title">Foto Terbaru</p>
        {photos.length === 0 ? (
          <div className="empty-state">Belum ada foto ter-upload. Upload foto lewat halaman Bangunan atau aplikasi Mobile.</div>
        ) : (
          <div className="photo-grid">
            {photos.map((p) => (
              <div className="photo-tile" key={p.id} title={`${p.capital} · No. Unit ${p.no_unit}`}>
                <img src={p.data_url} alt={p.capital} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
