"use client";

export const GOOGLE_OAUTH_CALLBACK_PATH = "/auth/google/callback";
const GOOGLE_OAUTH_PENDING_KEY = "formsify_google_oauth_pending";
const GOOGLE_OAUTH_MAX_AGE_MS = 10 * 60 * 1000;

export type GoogleOAuthIntent = "login" | "register";

export type GoogleOAuthPendingRequest = {
  state: string;
  nextPath: string;
  intent: GoogleOAuthIntent;
  createdAt: number;
};

const normalizeNextPath = (value: string | null | undefined, fallback: string) => {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
};

export const getGoogleOAuthRedirectUri = () => {
  if (typeof window === "undefined") {
    return GOOGLE_OAUTH_CALLBACK_PATH;
  }
  return new URL(GOOGLE_OAUTH_CALLBACK_PATH, window.location.origin).toString();
};

export const createGoogleOAuthState = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const saveGoogleOAuthPendingRequest = (payload: GoogleOAuthPendingRequest) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(GOOGLE_OAUTH_PENDING_KEY, JSON.stringify(payload));
};

export const consumeGoogleOAuthPendingRequest = (state: string | null) => {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(GOOGLE_OAUTH_PENDING_KEY);
  window.sessionStorage.removeItem(GOOGLE_OAUTH_PENDING_KEY);
  if (!raw || !state) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<GoogleOAuthPendingRequest>;
    if (
      typeof parsed.state !== "string" ||
      typeof parsed.nextPath !== "string" ||
      (parsed.intent !== "login" && parsed.intent !== "register") ||
      typeof parsed.createdAt !== "number"
    ) {
      return null;
    }
    if (parsed.state !== state) {
      return null;
    }
    if (Date.now() - parsed.createdAt > GOOGLE_OAUTH_MAX_AGE_MS) {
      return null;
    }

    return {
      state: parsed.state,
      nextPath: normalizeNextPath(parsed.nextPath, parsed.intent === "register" ? "/dashboard" : "/"),
      intent: parsed.intent,
      createdAt: parsed.createdAt,
    } satisfies GoogleOAuthPendingRequest;
  } catch {
    return null;
  }
};

export const getDefaultNextPathForIntent = (intent: GoogleOAuthIntent) =>
  intent === "register" ? "/dashboard" : "/";

export const sanitizeNextPath = (value: string | null | undefined, intent: GoogleOAuthIntent) =>
  normalizeNextPath(value, getDefaultNextPathForIntent(intent));
