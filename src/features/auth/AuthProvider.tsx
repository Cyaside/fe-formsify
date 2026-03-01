"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi, type AuthUser } from "@/shared/api/auth";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  loginWithGoogle: (payload: { idToken?: string; code?: string }) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applySessionFromMe = useCallback(
    (data: { token?: string; user: AuthUser }) => {
      const resolvedToken =
        typeof data.token === "string" && data.token.trim().length > 0
          ? data.token
          : null;
      setToken(resolvedToken);
      setUser(data.user);
      return data.user;
    },
    [],
  );

  const saveSession = useCallback(
    (nextToken: string, nextUser: AuthUser) => {
      setToken(nextToken);
      setUser(nextUser);
    },
    [],
  );

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await authApi.me();
      return applySessionFromMe(data);
    } catch {
      clearSession();
      return null;
    }
  }, [applySessionFromMe, clearSession]);

  useEffect(() => {
    authApi.me()
      .then((data) => {
        applySessionFromMe(data);
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [applySessionFromMe, clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    saveSession(data.token, data.user);
    return data.user;
  }, [saveSession]);

  const loginWithGoogle = useCallback(
    async (payload: { idToken?: string; code?: string }) => {
      const data = await authApi.google(payload);
      saveSession(data.token, data.user);
      return data.user;
    },
    [saveSession],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await authApi.register({ name, email, password });
      saveSession(data.token, data.user);
      return data.user;
    },
    [saveSession],
  );

  const logout = useCallback(() => {
    authApi.logout().catch(() => null);
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, loginWithGoogle, register, logout, refresh }),
    [user, token, loading, login, loginWithGoogle, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
