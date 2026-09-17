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
          isFirstInit ? new Promise(resolve => setTimeout(resolve, 800)) : Promise.resolve()
        ]);
        sessionStorage.setItem('session_initialized', 'true');
        const userData = res?.data !== undefined ? res.data : (res?.user || res);
        setUser(userData);
      } catch (err) {
        console.error('Failed to load user profile:', err);
        setToken(null);
        setUser(null);
        localStorage.removeItem('money_tracker_token');
        localStorage.removeItem('demo_login_time');
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  // Demo Account 5-Minute Active Session Auto-Logout
  useEffect(() => {
    if (!user || user.email !== 'demo@moneytracker.com') {
      return;
    }

    const DEMO_DURATION_MS = 5 * 60 * 1000; // 5 minutes (300,000 ms)
    let loginTime = Number(localStorage.getItem('demo_login_time'));
    if (!loginTime) {
      loginTime = Date.now();
      localStorage.setItem('demo_login_time', loginTime.toString());
    }

    const elapsed = Date.now() - loginTime;
    const remainingTime = Math.max(0, DEMO_DURATION_MS - elapsed);

    if (remainingTime <= 0) {
      alert('⏱️ Your 5-minute Demo Session has expired. Please sign in again or register a free account to continue.');
      logout();
      return;
    }

    const timer = setTimeout(() => {
      alert('⏱️ Your 5-minute Demo Session has expired. Please sign in again or register a free account to continue.');
      logout();
    }, remainingTime);

    return () => clearTimeout(timer);
  }, [user]);

  const login = async (email, pin) => {
    const res = await api.post('/auth/login', { email, pin });
    const payload = res?.data !== undefined ? res.data : res;
    const userData = payload.user || payload.data || payload;
    const newToken = payload.token || res.token;
    localStorage.setItem('money_tracker_token', newToken);
    sessionStorage.setItem('first_load_after_login', 'true');
    if (userData.email === 'demo@moneytracker.com') {
      localStorage.setItem('demo_login_time', Date.now().toString());
    } else {
      localStorage.removeItem('demo_login_time');
    }
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (name, username, email, pin, currency = '₹') => {
    const res = await api.post('/auth/register', { name, username, email, pin, currency });
    const payload = res?.data !== undefined ? res.data : res;
    const userData = payload.user || payload.data || payload;
    const newToken = payload.token || res.token;
    localStorage.setItem('money_tracker_token', newToken);
    sessionStorage.setItem('first_load_after_login', 'true');
    localStorage.removeItem('demo_login_time');
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const loginDemo = async () => {
    return login('demo@moneytracker.com', '1234');
  };

  const logout = () => {
    localStorage.removeItem('money_tracker_token');
    localStorage.removeItem('demo_login_time');
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
