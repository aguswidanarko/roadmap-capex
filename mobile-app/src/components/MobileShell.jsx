import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { getPendingCounts, onSyncChange } from '../db/syncEngine';

const TABS = [
  { to: '/', icon: '⌂', label: 'Home' },
  { to: '/buildings', icon: '☷', label: 'Bangunan' },
  { to: '/map', icon: '⚑', label: 'Peta' },
  { to: '/sync', icon: '↻', label: 'Sync' },
  { to: '/settings', icon: '⚙', label: 'Setting' },
];

export default function MobileShell({ title, sub, children, hideNav }) {
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    const refresh = () => getPendingCounts().then((c) => setPending(c.Pending + c.Failed));
    refresh();
    return onSyncChange(refresh);
  }, []);

  return (
    <div className="mobile-shell">
      <div className="mobile-topbar">
        <div>
          <h1>{title}</h1>
          {sub && <div className="sub">{sub}</div>}
        </div>
        <div className="conn-chip">
          <span className={`online-dot ${online ? 'on' : 'off'}`} />
          {online ? 'Online' : 'Offline'}
          {pending > 0 && <span style={{ marginLeft: 6 }}>· {pending} pending</span>}
        </div>
      </div>
      <div className="mobile-content">{children}</div>
      {!hideNav && (
        <nav className="bottom-nav">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="nav-icon">{t.icon}</span>{t.label}
              {t.to === '/sync' && pending > 0 && <span className="pill-count">{pending}</span>}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
