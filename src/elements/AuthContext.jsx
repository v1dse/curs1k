import { createContext, useContext, useState, useEffect } from 'react';
import { apiLogin, apiVerify, Mock } from '../api/api';

const AuthCtx = createContext(null);

// Set USE_MOCK = false when FastAPI backend is running
const USE_MOCK = true;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('sp_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }

    if (USE_MOCK) {
      const saved = localStorage.getItem('sp_user');
      if (saved) setUser(JSON.parse(saved));
      setLoading(false);
      return;
    }

    // Verify token with real backend
    apiVerify()
      .then(data => setUser(data))
      .catch(() => {
        localStorage.removeItem('sp_token');
        localStorage.removeItem('sp_user');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (username, password) => {
    if (USE_MOCK) {
      const data = Mock.login(username, password);
      localStorage.setItem('sp_token', data.access_token);
      localStorage.setItem('sp_user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      return;
    }
    const data = await apiLogin(username, password);
    localStorage.setItem('sp_token', data.access_token);
    localStorage.setItem('sp_user', JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('sp_token');
    localStorage.removeItem('sp_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, token, loading, login, logout, useMock: USE_MOCK }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
