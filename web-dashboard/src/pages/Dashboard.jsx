import { useEffect, useState } from 'react';
import api from '../api';
import { useFilters } from '../context/FilterContext';
import RegionPtFilter from '../components/RegionPtFilter';
import Slideshow from '../components/Slideshow';

export default function Dashboard() {
  const { params, region, pt } = useFilters();
  const [home, setHome] = useState(null);
  const [summary, setSummary] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [maps, setMaps] = useState([]);

  useEffect(() => {
    api.get('/home', { params }).then((r) => setHome(r.data));
    api.get('/roadmap/summary', { params }).then((r) => setSummary(r.data));
    api.get('/photos/featured', { params }).then((r) => setPhotos(r.data));
    api.get('/campus-maps/preview/slideshow', { params }).then((r) => setMaps(r.data));
  }, [region, pt]);

  if (!home || !summary) return <div className="empty-state">Memuat data…</div>;

  const photoItems = photos.map((p) => ({ ...p, __caption: `${p.capital || 'Foto'}${p.blok ? ' · ' + p.blok : ''}` }));
  const mapItems = maps.map((m) => ({ ...m, __caption: `${m.title || m.blok} · ${m.kebun}` }));

  return (
    <div>
      <RegionPtFilter />

      {home.alerts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {home.alerts.map((a, i) => (
            <div key={i} className={`alert alert-${a.severity === 'error' ? 'error' : 'warning'}`}>
              <strong>{a.severity === 'error' ? '⚠' : 'ⓘ'}</strong> {a.message}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-5">
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
          <div className="kpi-label">Progress Pembangunan BN &amp; BB</div>
          <div className="kpi-value">{home.kpi.progress_bn_bb.unit.toLocaleString('id-ID')} unit</div>
          <div className="kpi-sub">{home.kpi.progress_bn_bb.percent}% dari program berjalan</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Progress Pembangunan All</div>
          <div className="kpi-value">{home.kpi.progress_all.unit.toLocaleString('id-ID')}</div>
          <div className="kpi-sub">{home.kpi.progress_all.percent}% dari program berjalan</div>
        </div>
      </div>

      <div className="dashboard-windows" style={{ marginTop: 16 }}>
        <div className="card">
          <p className="card-title">Jumlah Bangunan per Jenis &middot; Kategori Pelaksanaan</p>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table kategori-table">
              <thead>
                <tr>
                  <th rowSpan={2}>No.</th>
                  <th rowSpan={2}>Jenis Bangunan</th>
                  <th rowSpan={2}>Existing<br />TD 2025</th>
                  <th colSpan={5} className="group-head">Kategori (Pelaksanaan)</th>
                  <th rowSpan={2}>Estimasi<br />2030</th>
                </tr>
                <tr>
                  <th className="group-bn">Bangun<br />(BN)</th>
                  <th className="group-ex">Existing<br />(EX)</th>
                  <th className="group-af">Alih Fungsi<br />(AF)</th>
                  <th className="group-br">Bongkar<br />(BR)</th>
                  <th className="group-bb">Bongkar<br />Bangun (BB)</th>
                </tr>
              </thead>
              <tbody>
                {summary.by_type.map((r) => (
                  <tr key={r.no}>
                    <td>{r.no}</td>
                    <td>{r.jenis_bangunan}</td>
                    <td>{r.existing_td2025 || '-'}</td>
                    <td>{r.bn || '-'}</td>
                    <td>{r.ex || '-'}</td>
                    <td>{r.af || '-'}</td>
                    <td>{r.br || '-'}</td>
                    <td>{r.bb || '-'}</td>
                    <td>{r.estimasi_2030 || '-'}</td>
                  </tr>
                ))}
                {summary.by_type.length === 0 && (
                  <tr><td colSpan={9}><div className="empty-state">Tidak ada data untuk filter region/PT ini.</div></td></tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Total</td>
                  <td>{summary.totals.existing_td2025}</td>
                  <td>{summary.totals.bn}</td>
                  <td>{summary.totals.ex}</td>
                  <td>{summary.totals.af}</td>
                  <td>{summary.totals.br}</td>
                  <td>{summary.totals.bb}</td>
                  <td>{summary.totals.estimasi_2030}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="dashboard-side">
          <div className="card">
            <p className="card-title">Slideshow Peta Kampus</p>
            <Slideshow
              items={mapItems}
              to="/peta"
              emptyText="Belum ada peta kampus ter-upload. Buka halaman Peta Kampus untuk mengunggah."
              renderFrame={() => <span className="slideshow-doc-icon">🗺</span>}
            />
          </div>
          <div className="card">
            <p className="card-title">Slideshow Foto Bangunan</p>
            <Slideshow
              items={photoItems}
              to="/foto"
              emptyText="Belum ada foto unggulan. Admin dapat memilih hingga 8 foto di halaman Foto."
              renderFrame={(p) => <img src={p.data_url} alt={p.capital || 'Foto bangunan'} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
