import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getStoredToken, setStoredToken } from '../services/apiClient.js';

const AuthContext = createContext(null);

const USER_KEY = 'trusthome_user';
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (raw && getStoredToken()) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem(USER_KEY);
        setStoredToken(null);
      }
    }
  }, []);

  const clearInactivityTimer = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearInactivityTimer();
    setUser(null);
    localStorage.removeItem(USER_KEY);
    setStoredToken(null);
  }, [clearInactivityTimer]);

  const startInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    timeoutRef.current = window.setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearInactivityTimer, logout]);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    startInactivityTimer();
  };

  useEffect(() => {
    if (!user) {
      clearInactivityTimer();
      return;
    }

    const handleActivity = () => {
      startInactivityTimer();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));
    startInactivityTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      clearInactivityTimer();
    };
  }, [user, startInactivityTimer, clearInactivityTimer]);

  const value = { user, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
