import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('rw_token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('rw_token'));

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => { localStorage.removeItem('rw_token'); setToken(null); setUser(null); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, []);

  const start = ({ token: t, user: u }) => { localStorage.setItem('rw_token', t); setToken(t); setUser(u); return u; };
  const login = async (email, password) => start((await api.post('/auth/login', { email, password })).data);
  const register = async (payload) => start((await api.post('/auth/register', payload)).data);
  const refresh = async () => { const r = await api.get('/auth/me'); setUser(r.data.user); };
  const logout = () => { localStorage.removeItem('rw_token'); setToken(null); setUser(null); };

  return <AuthContext.Provider value={{ user, token, loading, login, register, logout, refresh }}>{children}</AuthContext.Provider>;
}
