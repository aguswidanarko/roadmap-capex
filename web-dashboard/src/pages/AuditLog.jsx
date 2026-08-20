import { useEffect, useState } from 'react';
import api from '../api';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  useEffect(() => { api.get('/audit-log?limit=300').then((r) => setLogs(r.data)); }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Audit Log</h1>
          <p>Riwayat perubahan: siapa, kapan, dan apa yang berubah (WEB-013 / BRD section 16).</p>
        </div>
      </div>
      <div className="card">
        <table className="data-table">
          <thead><tr><th>Waktu</th><th>Entity</th><th>Record</th><th>Action</th><th>User</th><th>Source</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{new Date(l.created_at).toLocaleString('id-ID')}</td>
                <td>{l.entity}</td><td>{l.record_id}</td>
                <td><strong>{l.action}</strong></td><td>{l.user}</td><td>{l.source}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={6}><div className="empty-state">Belum ada aktivitas.</div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
