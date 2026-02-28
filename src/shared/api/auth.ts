import { apiRequest } from "@/shared/api/client";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  provider?: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export const authApi = {
  me: () => apiRequest<{ user: AuthUser }>("/api/auth/me"),
  login: (payload: { email: string; password: string }) =>
    apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: payload,
      showGlobalLoading: true,
    }),
  register: (payload: { name: string; email: string; password: string }) =>
    apiRequest<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: payload,
      showGlobalLoading: true,
    }),
  logout: () => apiRequest("/api/auth/logout", { method: "POST" }),
  google: (payload: { idToken?: string; code?: string }) =>
    apiRequest<AuthResponse>("/api/auth/google", {
      method: "POST",
      body: payload,
    }),
};
