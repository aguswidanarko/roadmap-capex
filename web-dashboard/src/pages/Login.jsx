import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login gagal. Periksa koneksi ke backend API.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Roadmap CAPEX Bangunan</h1>
        <p>Dashboard Web &middot; PT. XXX &middot; Periode 2026&ndash;2030</p>
        {error && <div className="login-error">{error}</div>}
        <div className="field">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Memproses…' : 'Masuk'}
        </button>
        <div className="demo-accounts">
          <strong>Akun demo (WEB-001, role &amp; scope):</strong><br />
          admin / admin123 &middot; operator / operator123<br />
          viewer / viewer123 &middot; superadmin / super123
        </div>
      </form>
    </div>
  );
}
