import { createContext, useEffect, useState, type ReactNode } from 'react';
import { getCurrentUser, login as loginRequest, register as registerRequest, updateProfile as updateProfileRequest, type ProfileUpdate, type User } from '../services/auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (update: ProfileUpdate) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
const tokenKey = 'culture-quest-token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem(tokenKey)) { setLoading(false); return; }
    getCurrentUser().then(setUser).catch(() => localStorage.removeItem(tokenKey)).finally(() => setLoading(false));
  }, []);

  const persist = (result: { accessToken: string; user: User }) => {
    localStorage.setItem(tokenKey, result.accessToken);
    setUser(result.user);
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    login: async (email, password) => persist(await loginRequest({ email, password })),
    register: async (name, email, password) => persist(await registerRequest({ name, email, password })),
    updateProfile: async (update) => setUser(await updateProfileRequest(update)),
    logout: () => { localStorage.removeItem(tokenKey); setUser(null); },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}
