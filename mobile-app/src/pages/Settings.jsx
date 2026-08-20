import { useNavigate } from 'react-router-dom';
import MobileShell from '../components/MobileShell';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../api';
import { db } from '../db/db';
import { useEffect, useState } from 'react';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ buildings: 0, photos: 0 });

  useEffect(() => {
    Promise.all([db.buildings.count(), db.photos.count()]).then(([buildings, photos]) => setStats({ buildings, photos }));
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <MobileShell title="Pengaturan">
      <div className="card">
        <p className="card-title">Akun</p>
        <p style={{ fontSize: 15, fontWeight: 700 }}>{user?.full_name}</p>
        <p style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>{user?.username} &middot; role: {user?.role}</p>
      </div>
      <div className="card">
        <p className="card-title">Penyimpanan Lokal</p>
        <p style={{ fontSize: 13 }}>Server API: {API_URL}</p>
        <p style={{ fontSize: 13 }}>{stats.buildings} data bangunan &middot; {stats.photos} foto tersimpan di perangkat.</p>
      </div>
      <button className="btn-big btn-danger" onClick={handleLogout}>Keluar</button>
    </MobileShell>
  );
}
