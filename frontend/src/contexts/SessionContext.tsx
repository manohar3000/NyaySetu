import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SessionData {
  name: string;
  role: 'user' | 'lawyer' | null;
  firstLogin: boolean;
  isAuthenticated: boolean;
  setSession: (data: Partial<SessionData>) => void;
  logout: () => void;
}

const defaultSession: SessionData = {
  name: '',
  role: null,
  firstLogin: false,
  isAuthenticated: false,
  setSession: () => {},
  logout: () => {},
};

const SessionContext = createContext<SessionData>(defaultSession);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSessionState] = useState<SessionData>(defaultSession);

  useEffect(() => {
    // Load from localStorage
    const name = localStorage.getItem('vaanee_user_name') || '';
    const role = (localStorage.getItem('vaanee_user_role') as 'user' | 'lawyer' | null) || null;
    const firstLogin = localStorage.getItem('vaanee_first_login') === 'true';
    const token = localStorage.getItem('vaanee_jwt');
    setSessionState(s => ({
      ...s,
      name,
      role,
      firstLogin,
      isAuthenticated: !!token,
    }));
  }, []);

  const setSession = (data: Partial<SessionData>) => {
    setSessionState(s => {
      const updated = { ...s, ...data };
      if (data.name !== undefined) localStorage.setItem('vaanee_user_name', data.name);
      if (data.role !== undefined) localStorage.setItem('vaanee_user_role', data.role || '');
      if (data.firstLogin !== undefined) localStorage.setItem('vaanee_first_login', data.firstLogin ? 'true' : 'false');
      if (data.isAuthenticated === false) localStorage.removeItem('vaanee_jwt');
      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem('vaanee_jwt');
    localStorage.removeItem('vaanee_user_name');
    localStorage.removeItem('vaanee_user_role');
    localStorage.removeItem('vaanee_first_login');
    setSessionState(defaultSession);
  };

  return (
    <SessionContext.Provider value={{ ...session, setSession, logout }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext); 