import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api/authApi';
import API from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await getMe();
      setUser(res.data.data);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  const loginUser = (userData, tokenStr, refreshTokenStr) => {
    localStorage.setItem('token', tokenStr);
    if (refreshTokenStr) localStorage.setItem('refreshToken', refreshTokenStr);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenStr);
    setUser(userData);
  };

  const logout = async () => {
    try {
      if (token) await API.post('/auth/logout');
    } catch (e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginUser, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
