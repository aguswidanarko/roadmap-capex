import { useEffect, useState } from 'react';
import api from '../api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', full_name: '', role: 'viewer' });
  const [error, setError] = useState('');

  function load() { api.get('/users').then((r) => setUsers(r.data)); }
  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', form);
      setForm({ username: '', password: '', full_name: '', role: 'viewer' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menambah user');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>User &amp; Role</h1>
          <p>Konfigurasi user/role global &mdash; khusus Super Admin (BRD section 4, opsional).</p>
        </div>
      </div>

      <div className="card">
        <p className="card-title">Tambah User</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit} className="form-grid">
          <div><label>Username</label><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
          <div><label>Password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
          <div><label>Nama Lengkap</label><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div>
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="viewer">Viewer / Management</option>
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
          <div className="full"><button className="btn btn-primary">Tambah User</button></div>
        </form>
      </div>

      <div className="card">
        <p className="card-title">Daftar User</p>
        <table className="data-table">
          <thead><tr><th>Username</th><th>Nama</th><th>Role</th><th>Scope</th><th>Dibuat</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td><td>{u.full_name}</td><td>{u.role}</td><td>{u.scope_kebun}</td>
                <td>{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
