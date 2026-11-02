import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth } from '../lib/api';
import type { User } from '../types/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('kanbot_token'),
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('kanbot_token');
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    auth
      .me()
      .then((data) => {
        setState({ user: data.user, token, isLoading: false });
      })
      .catch(() => {
        localStorage.removeItem('kanbot_token');
        setState({ user: null, token: null, isLoading: false });
      });
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('kanbot_token', token);
    setState({ user, token, isLoading: false });
  };

  const logout = () => {
    localStorage.removeItem('kanbot_token');
    setState({ user: null, token: null, isLoading: false });
  };

  return <AuthContext.Provider value={{ ...state, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
