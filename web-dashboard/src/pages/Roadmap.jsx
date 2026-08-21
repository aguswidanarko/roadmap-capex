import { useEffect, useState } from 'react';
import api from '../api';
import { useFilters } from '../context/FilterContext';
import RegionPtFilter from '../components/RegionPtFilter';

const PROGRAM_YEARS = [2026, 2027, 2028, 2029, 2030];

function formatRp(v) {
  if (!v) return '-';
  return 'Rp ' + Number(v).toLocaleString('id-ID');
}

export default function Roadmap() {
  const { params, region, pt } = useFilters();
  const [home, setHome] = useState(null);
  const [summary, setSummary] = useState(null);
  const [detail, setDetail] = useState(null);
  const [progressYear, setProgressYear] = useState(2026);
  const [progressTahun, setProgressTahun] = useState(null);
  const [tab, setTab] = useState('program');

  useEffect(() => {
    api.get('/home', { params }).then((r) => setHome(r.data));
    api.get('/roadmap/summary', { params }).then((r) => setSummary(r.data));
    api.get('/roadmap/detail').then((r) => setDetail(r.data));
  }, [region, pt]);

  useEffect(() => {
    api.get('/roadmap/progress-tahun', { params: { ...params, year: progressYear } }).then((r) => setProgressTahun(r.data));
  }, [region, pt, progressYear]);

  if (!home || !summary || !detail) return <div className="empty-state">Memuat data…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Roadmap CAPEX Bangunan</h1>
          <p>Program pembangunan per tahun (2026&ndash;2030) dan progress tahun berjalan, per Region &amp; PT/Kebun.</p>
        </div>
      </div>

      <RegionPtFilter />

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
          <div className="kpi-sub">{home.kpi.progress_bn_bb.percent}% dari program berjalan</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Progress All</div>
          <div className="kpi-value">{home.kpi.progress_all.unit} unit</div>
          <div className="kpi-sub">{home.kpi.progress_all.percent}% dari program berjalan</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'program' ? 'active' : ''}`} onClick={() => setTab('program')}>Program &amp; Progress</button>
        <button className={`tab ${tab === 'detail' ? 'active' : ''}`} onClick={() => setTab('detail')}>Detail per Subjenis</button>
      </div>

      {tab === 'program' && (
        <>
          <div className="card">
            <p className="card-title">Program Pembangunan per Tahun (Unit)</p>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>No</th><th>Jenis Bangunan</th><th>2026</th><th>2027</th><th>2028</th><th>2029</th><th>2030</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {summary.program_by_type.map((r) => (
                    <tr key={r.no}>
                      <td>{r.no}</td><td>{r.jenis_bangunan}</td>
                      <td>{r.y2026 || '–'}</td><td>{r.y2027 || '–'}</td><td>{r.y2028 || '–'}</td><td>{r.y2029 || '–'}</td><td>{r.y2030 || '–'}</td>
                      <td>{r.total}</td>
                    </tr>
                  ))}
                  {summary.program_by_type.length === 0 && (
                    <tr><td colSpan={8}><div className="empty-state">Belum ada bangunan dengan tahun program (roadmap_year) terisi untuk filter ini.</div></td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>Total</td>
                    <td>{summary.program_totals.y2026}</td><td>{summary.program_totals.y2027}</td><td>{summary.program_totals.y2028}</td>
                    <td>{summary.program_totals.y2029}</td><td>{summary.program_totals.y2030}</td><td>{summary.program_totals.total}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="page-header" style={{ marginBottom: 10 }}>
              <p className="card-title" style={{ margin: 0 }}>Progress Tahun Berjalan</p>
              <select value={progressYear} onChange={(e) => setProgressYear(Number(e.target.value))}>
                {PROGRAM_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {!progressTahun ? (
              <div className="empty-state">Memuat…</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th rowSpan={2}>No</th><th rowSpan={2}>Jenis Bangunan</th><th rowSpan={2}>Jlh</th><th rowSpan={2}>Biaya (Rp)</th>
                      <th colSpan={5} className="group-head">Ach (%)</th>
                    </tr>
                    <tr>
                      <th>0-25</th><th>25-50</th><th>50-75</th><th>75-99</th><th>100</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progressTahun.list.map((r) => (
                      <tr key={r.no}>
                        <td>{r.no}</td><td>{r.jenis_bangunan}</td><td>{r.jlh}</td><td>{formatRp(r.biaya)}</td>
                        <td>{r.p0_25 || '–'}</td><td>{r.p25_50 || '–'}</td><td>{r.p50_75 || '–'}</td><td>{r.p75_99 || '–'}</td><td>{r.p100 || '–'}</td>
                      </tr>
                    ))}
                    {progressTahun.list.length === 0 && (
                      <tr><td colSpan={9}><div className="empty-state">Tidak ada program berjalan di tahun {progressYear} untuk filter ini.</div></td></tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2}>Total</td><td>{progressTahun.totals.jlh}</td><td>{formatRp(progressTahun.totals.biaya)}</td>
                      <td>{progressTahun.totals.p0_25}</td><td>{progressTahun.totals.p25_50}</td><td>{progressTahun.totals.p50_75}</td>
                      <td>{progressTahun.totals.p75_99}</td><td>{progressTahun.totals.p100}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'detail' && (
        <div>
          <p style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: -6, marginBottom: 12 }}>
            Tabel referensi tetap (fixture BRD awal, belum mengikuti filter Region/PT).
          </p>
          {Object.entries(detail.grouped).map(([type, rows]) => (
            <div className="card" key={type}>
              <p className="card-title">{type}</p>
              <table className="data-table">
                <thead>
                  <tr><th>Capital / Subjenis</th><th>Existing 2025</th><th>2026</th><th>2027</th><th>2028</th><th>2029</th><th>2030</th><th>Total</th><th>Est. 2030</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.capital}</td><td>{r.ex2025}</td><td>{r.y2026 || '–'}</td><td>{r.y2027 || '–'}</td>
                      <td>{r.y2028 || '–'}</td><td>{r.y2029 || '–'}</td><td>{r.y2030 || '–'}</td><td>{r.total}</td><td>{r.est2030}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
