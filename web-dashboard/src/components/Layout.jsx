import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '⌂', roles: ['viewer', 'operator', 'admin', 'superadmin'] },
  { to: '/roadmap', label: 'Roadmap', icon: '⌗', roles: ['viewer', 'operator', 'admin', 'superadmin'] },
  { to: '/bangunan', label: 'Bangunan', icon: '☷', roles: ['viewer', 'operator', 'admin', 'superadmin'] },
  { to: '/peta', label: 'Peta', icon: '⚑', roles: ['viewer', 'operator', 'admin', 'superadmin'] },
  { to: '/foto', label: 'Foto', icon: '▦', roles: ['viewer', 'operator', 'admin', 'superadmin'] },
  { to: '/master-data', label: 'Master Data', icon: '⚙', roles: ['admin', 'superadmin'] },
  { to: '/sync-center', label: 'Sync Center', icon: '↻', roles: ['operator', 'admin', 'superadmin'] },
  { to: '/reports', label: 'Reports', icon: '⎘', roles: ['viewer', 'operator', 'admin', 'superadmin'] },
  { to: '/audit-log', label: 'Audit Log', icon: '☷̲', roles: ['operator', 'admin', 'superadmin'] },
  { to: '/users', label: 'User & Role', icon: '☷̲', roles: ['superadmin'] },
];

const TITLES = {
  '/': 'Dashboard Home', '/roadmap': 'Roadmap CAPEX', '/bangunan': 'Data Bangunan', '/peta': 'Peta Interaktif',
  '/foto': 'Foto Bangunan', '/master-data': 'Master Data', '/sync-center': 'Sync Center', '/reports': 'Reports & Export',
  '/audit-log': 'Audit Log', '/users': 'User & Role',
};

export default function Layout({ children }) {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const path = window.location.hash.replace('#', '') || '/';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          Roadmap CAPEX
          <small>Bangunan · Dashboard Web</small>
        </div>
        <nav>
          {NAV.filter(item => item.roles.includes(user?.role)).map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'active' : ''}>
              <span aria-hidden>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          PT. XXX &middot; Periode 2026&ndash;2030
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="topbar-title">{TITLES[path] || 'Roadmap CAPEX'}</div>
          <div className="user-chip">
            <span>{user?.full_name}</span>
            <span className="role-badge">{user?.role}</span>
            <button className="btn btn-sm" onClick={() => { logout(); navigate('/login'); }}>Keluar</button>
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
