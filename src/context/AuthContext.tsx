import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthCredentials } from '../api/client';
import { createApi } from '../api/client';

const STORAGE_KEY = 'hootcam-auth';

function loadStored(): AuthCredentials | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as AuthCredentials;
    if (j?.apiBaseUrl && j?.username && j?.password) return j;
  } catch {
    // ignore
  }
  return null;
}

function saveStored(creds: AuthCredentials | null) {
  if (creds) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

interface AuthContextValue {
  credentials: AuthCredentials | null;
  api: ReturnType<typeof createApi>;
  login: (creds: AuthCredentials) => void;
  logout: () => void;
  updatePassword: (newPassword: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<AuthCredentials | null>(loadStored);

  const login = useCallback((creds: AuthCredentials) => {
    setCredentials(creds);
    saveStored(creds);
  }, []);

  const logout = useCallback(() => {
    setCredentials(null);
    saveStored(null);
  }, []);

  const updatePassword = useCallback(
    (newPassword: string) => {
      if (!credentials) return;
      const next: AuthCredentials = {
        ...credentials,
        password: newPassword,
      };
      setCredentials(next);
      saveStored(next);
    },
    [credentials]
  );

  const api = useMemo(() => createApi(credentials), [credentials]);

  const value = useMemo<AuthContextValue>(
    () => ({ credentials, api, login, logout, updatePassword }),
    [credentials, api, login, logout, updatePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
