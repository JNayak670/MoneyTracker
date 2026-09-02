import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('money_tracker_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      const isFirstInit = !sessionStorage.getItem('session_initialized');
      try {
        const [res] = await Promise.all([
          api.get('/auth/me'),
          isFirstInit ? new Promise(resolve => setTimeout(resolve, 1400)) : Promise.resolve()
        ]);
        sessionStorage.setItem('session_initialized', 'true');
        setUser(res.data);
      } catch (err) {
        console.error('Failed to load user profile:', err);
        setToken(null);
        setUser(null);
        localStorage.removeItem('money_tracker_token');
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  const login = async (email, pin) => {
    const res = await api.post('/auth/login', { email, pin });
    const { user: userData, token: newToken } = res.data;
    localStorage.setItem('money_tracker_token', newToken);
    sessionStorage.setItem('first_load_after_login', 'true');
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, pin, currency = '₹') => {
    const res = await api.post('/auth/register', { name, email, pin, currency });
    const { user: userData, token: newToken } = res.data;
    localStorage.setItem('money_tracker_token', newToken);
    sessionStorage.setItem('first_load_after_login', 'true');
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const loginDemo = async () => {
    return login('demo@moneytracker.com', '1234');
  };

  const logout = () => {
    localStorage.removeItem('money_tracker_token');
    sessionStorage.removeItem('first_load_after_login');
    sessionStorage.removeItem('session_initialized');
    setToken(null);
    setUser(null);
  };

  const updateSettings = async (payload) => {
    const res = await api.put('/auth/settings', payload);
    setUser(res.data);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, loginDemo, logout, updateSettings }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
