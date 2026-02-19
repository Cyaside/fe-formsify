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
import { apiRequest } from "@/lib/api";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  provider?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const saveSession = useCallback((nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await apiRequest<{ user: AuthUser }>("/api/auth/me");
      setUser(data.user);
      return data.user;
    } catch (error) {
      clearSession();
      return null;
    }
  }, [clearSession]);

  useEffect(() => {
    apiRequest<{ user: AuthUser }>("/api/auth/me")
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<{ token: string; user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    saveSession(data.token, data.user);
    return data.user;
  }, [saveSession]);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await apiRequest<{ token: string; user: AuthUser }>(
        "/api/auth/register",
        {
          method: "POST",
          body: { name, email, password },
        },
      );
      saveSession(data.token, data.user);
      return data.user;
    },
    [saveSession],
  );

  const logout = useCallback(() => {
    apiRequest("/api/auth/logout", { method: "POST" }).catch(() => null);
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, register, logout, refresh }),
    [user, token, loading, login, register, logout, refresh],
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
