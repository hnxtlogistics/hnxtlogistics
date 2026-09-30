import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    api
      .get('/auth/me')
      .then(({ user: me }) => { setUser(me); setStatus('authenticated'); })
      .catch(() => { setUser(null); setStatus('anonymous'); });
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { user: me } = await api.post('/auth/login', { email, password });
    setUser(me);
    setStatus('authenticated');
    return me;
  }, []);

  const signOut = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {});
    setUser(null);
    setStatus('anonymous');
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, signIn, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}
