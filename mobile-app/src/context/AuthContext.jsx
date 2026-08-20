import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api';
import { getSession, setSession, clearSession, setMaster } from '../db/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getSession().then((s) => { setUser(s?.user || null); setReady(true); });
  }, []);

  // MOB-001: login/session must be validated. Once validated, session persists locally so the
  // field user can keep working offline (BRD section 10: internet is not a prerequisite to work).
  const login = useCallback(async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    await setSession(res.data.token, res.data.user);
    setUser(res.data.user);
    // Prefetch master/reference data for offline use (MOB-003)
    try {
      const [types, subtypes, categories] = await Promise.all([
        api.get('/master/building-types'), api.get('/master/subtypes'), api.get('/master/categories'),
      ]);
      await setMaster('building_types', types.data);
      await setMaster('subtypes', subtypes.data);
      await setMaster('categories', categories.data);
    } catch { /* offline-tolerant: master may already be cached from a previous session */ }
    return res.data.user;
  }, []);

  const logout = useCallback(async () => { await clearSession(); setUser(null); }, []);

  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
