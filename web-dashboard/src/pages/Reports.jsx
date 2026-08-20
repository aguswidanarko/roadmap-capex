import { API_URL } from '../api';

function authedHref(path) {
  const token = localStorage.getItem('capex_token');
  return `${API_URL}${path}${path.includes('?') ? '&' : '?'}token=${encodeURIComponent(token || '')}`;
}

async function downloadWithAuth(path, filename) {
  const token = localStorage.getItem('capex_token');
  const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { alert('Gagal membuat report'); return; }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const REPORTS = [
  { key: 'roadmap-xlsx', title: 'Rekap Roadmap (Excel)', desc: 'Existing TD 2025, program tahunan 2026–2030, total, estimasi 2030 — numeric value untuk dihitung ulang.', path: '/reports/roadmap-detail.xlsx', file: 'roadmap-detail.xlsx' },
  { key: 'roadmap-pdf', title: 'Rekap Roadmap (PDF)', desc: 'Ringkasan roadmap dengan header perusahaan, periode filter, dan tanggal generate.', path: '/reports/roadmap-summary.pdf', file: 'roadmap-summary.pdf' },
  { key: 'buildings-xlsx', title: 'Building Detail (Excel)', desc: 'Lokasi, no unit, jenis, tahun, sign, roadmap, estimasi, progress, koordinat.', path: '/reports/buildings.xlsx', file: 'building-detail.xlsx' },
  { key: 'audit-xlsx', title: 'Audit Log (Excel)', desc: 'History perubahan lengkap dengan user, timestamp, old/new value.', path: '/reports/audit.xlsx', file: 'audit-log.xlsx' },
];

export default function Reports() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reports &amp; Export</h1>
          <p>Rekap existing/rencana/estimasi/progress. Export Excel/PDF mengikuti filter aktif (WEB-011 / WEB-012).</p>
        </div>
      </div>
      <div className="grid grid-2">
        {REPORTS.map((r) => (
          <div className="card" key={r.key}>
            <p className="card-title">{r.title}</p>
            <p style={{ fontSize: 13, color: 'var(--ink-secondary)', marginBottom: 14 }}>{r.desc}</p>
            <button className="btn btn-primary" onClick={() => downloadWithAuth(r.path, r.file)}>⬇ Generate &amp; Download</button>
          </div>
        ))}
      </div>
    </div>
  );
}
