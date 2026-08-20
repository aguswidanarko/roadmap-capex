import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('operator');
  const [password, setPassword] = useState('operator123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(navigator.onLine ? (err.response?.data?.error || 'Login gagal') : 'Tidak ada koneksi internet. Login pertama kali memerlukan koneksi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Roadmap CAPEX Bangunan</h1>
        <p>Mobile Offline &middot; PT. XXX &middot; Periode 2026&ndash;2030</p>
        {error && <div className="login-error">{error}</div>}
        <div className="field"><label>Username</label><input value={username} onChange={(e) => setUsername(e.target.value)} /></div>
        <div className="field"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="btn-big btn-primary" disabled={loading}>{loading ? 'Memproses…' : 'Masuk'}</button>
        <div className="demo-accounts">
          <strong>Akun demo (MOB-001):</strong><br />
          operator / operator123 &middot; admin / admin123
        </div>
      </form>
    </div>
  );
}
