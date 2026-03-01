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
const AUTH_TOKEN_STORAGE_KEY = "formsify.auth.token";

const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  return value && value.trim().length > 0 ? value : null;
};

const storeToken = (token: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

const clearStoredToken = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [loading, setLoading] = useState(true);

  const saveSession = useCallback((nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    storeToken(nextToken);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    clearStoredToken();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const applySessionFromMe = (
      data: { token?: string; user: AuthUser },
      fallbackToken?: string | null,
    ) => {
      const resolvedToken =
        typeof data.token === "string" && data.token.trim().length > 0
          ? data.token
          : typeof fallbackToken === "string" && fallbackToken.trim().length > 0
            ? fallbackToken
            : null;
      if (resolvedToken) {
        setToken(resolvedToken);
        storeToken(resolvedToken);
      } else {
        setToken(null);
        clearStoredToken();
      }
      setUser(data.user);
      return data.user;
    };

    try {
      const data = await authApi.me();
      return applySessionFromMe(data, null);
    } catch {
      try {
        const fallbackToken = getStoredToken();
        if (!fallbackToken) throw new Error("no fallback token");
        const data = await authApi.me(fallbackToken);
        return applySessionFromMe(data, fallbackToken);
      } catch {
        clearSession();
        return null;
      }
    }
  }, [clearSession]);

  useEffect(() => {
    const applySessionFromMe = (
      data: { token?: string; user: AuthUser },
      fallbackToken?: string | null,
    ) => {
      const resolvedToken =
        typeof data.token === "string" && data.token.trim().length > 0
          ? data.token
          : typeof fallbackToken === "string" && fallbackToken.trim().length > 0
            ? fallbackToken
            : null;
      if (resolvedToken) {
        setToken(resolvedToken);
        storeToken(resolvedToken);
      } else {
        setToken(null);
        clearStoredToken();
      }
      setUser(data.user);
    };

    authApi.me()
      .then((data) => {
        applySessionFromMe(data, null);
      })
      .catch(async () => {
        const fallbackToken = getStoredToken();
        if (!fallbackToken) {
          clearSession();
          return;
        }
        try {
          const data = await authApi.me(fallbackToken);
          applySessionFromMe(data, fallbackToken);
        } catch {
          clearSession();
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clearSession]);

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
