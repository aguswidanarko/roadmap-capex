import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import Buildings from './pages/Buildings';
import BuildingForm from './pages/BuildingForm';
import MapPage from './pages/MapPage';
import Sync from './pages/Sync';
import Settings from './pages/Settings';

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Home /></Protected>} />
      <Route path="/buildings" element={<Protected><Buildings /></Protected>} />
      <Route path="/buildings/:uuid" element={<Protected><BuildingForm /></Protected>} />
      <Route path="/map" element={<Protected><MapPage /></Protected>} />
      <Route path="/sync" element={<Protected><Sync /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
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
