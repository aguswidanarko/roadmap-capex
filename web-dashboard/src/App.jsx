import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Roadmap from './pages/Roadmap';
import Bangunan from './pages/Bangunan';
import Peta from './pages/Peta';
import Foto from './pages/Foto';
import MasterData from './pages/MasterData';
import SyncCenter from './pages/SyncCenter';
import Reports from './pages/Reports';
import AuditLog from './pages/AuditLog';
import Users from './pages/Users';

function Protected({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <div className="content"><div className="empty-state">Anda tidak memiliki akses ke halaman ini.</div></div>;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const ALL = ['viewer', 'operator', 'admin', 'superadmin'];
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected roles={ALL}><Dashboard /></Protected>} />
      <Route path="/roadmap" element={<Protected roles={ALL}><Roadmap /></Protected>} />
      <Route path="/bangunan" element={<Protected roles={ALL}><Bangunan /></Protected>} />
      <Route path="/peta" element={<Protected roles={ALL}><Peta /></Protected>} />
      <Route path="/foto" element={<Protected roles={ALL}><Foto /></Protected>} />
      <Route path="/master-data" element={<Protected roles={['admin', 'superadmin']}><MasterData /></Protected>} />
      <Route path="/sync-center" element={<Protected roles={['operator', 'admin', 'superadmin']}><SyncCenter /></Protected>} />
      <Route path="/reports" element={<Protected roles={ALL}><Reports /></Protected>} />
      <Route path="/audit-log" element={<Protected roles={['operator', 'admin', 'superadmin']}><AuditLog /></Protected>} />
      <Route path="/users" element={<Protected roles={['superadmin']}><Users /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}
