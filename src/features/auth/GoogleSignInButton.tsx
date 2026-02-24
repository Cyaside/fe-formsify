"use client";

import Script from "next/script";
import { useMemo, useState } from "react";
import {
  createGoogleOAuthState,
  getGoogleOAuthRedirectUri,
  saveGoogleOAuthPendingRequest,
  sanitizeNextPath,
  type GoogleOAuthIntent,
} from "@/features/auth/googleOAuth";

type GoogleCodeClient = {
  requestCode: () => void;
};

type GoogleCodeClientConfig = {
  client_id: string;
  scope: string;
  ux_mode: "redirect";
  redirect_uri: string;
  state: string;
  include_granted_scopes?: boolean;
};

type GoogleOAuth2Api = {
  initCodeClient: (config: GoogleCodeClientConfig) => GoogleCodeClient;
};

type GoogleWindow = Window & {
  google?: {
    accounts?: {
      oauth2?: GoogleOAuth2Api;
    };
  };
};

type GoogleSignInButtonProps = {
  intent: GoogleOAuthIntent;
  nextPath: string;
};

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
const GOOGLE_OAUTH_SCOPE = "openid email profile";

const GoogleMark = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
    <path
      fill="#EA4335"
      d="M12 10.2v3.95h5.5c-.24 1.27-.97 2.34-2.07 3.06l3.34 2.59c1.95-1.8 3.08-4.45 3.08-7.6 0-.72-.07-1.42-.2-2.1H12Z"
    />
    <path
      fill="#4285F4"
      d="M12 22c2.79 0 5.13-.92 6.84-2.49l-3.34-2.59c-.93.62-2.12.99-3.5.99-2.69 0-4.97-1.82-5.78-4.27H2.77v2.67A10.33 10.33 0 0 0 12 22Z"
    />
    <path
      fill="#FBBC05"
      d="M6.22 13.64A6.2 6.2 0 0 1 5.9 12c0-.57.11-1.12.32-1.64V7.69H2.77A10.33 10.33 0 0 0 1.67 12c0 1.65.4 3.2 1.1 4.31l3.45-2.67Z"
    />
    <path
      fill="#34A853"
      d="M12 6.09c1.52 0 2.88.52 3.95 1.55l2.96-2.96C17.12 3 14.79 2 12 2A10.33 10.33 0 0 0 2.77 7.69l3.45 2.67C7.03 7.91 9.31 6.09 12 6.09Z"
    />
  </svg>
);

export default function GoogleSignInButton({ intent, nextPath }: GoogleSignInButtonProps) {
  const [scriptReady, setScriptReady] = useState(
    () => Boolean((globalThis as GoogleWindow | undefined)?.google?.accounts?.oauth2),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfigured = Boolean(GOOGLE_CLIENT_ID);
  const label = intent === "register" ? "Sign up with Google" : "Login with Google";

  const helperText = useMemo(() => {
    if (!isConfigured) {
      return "Google login belum aktif. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID di frontend.";
    }
    if (!scriptReady) {
      return "Menyiapkan Google OAuth...";
    }
    return null;
  }, [isConfigured, scriptReady]);

  const handleClick = () => {
    if (!isConfigured) {
      return;
    }

    const googleOauth2 = (window as GoogleWindow).google?.accounts?.oauth2;
    if (!googleOauth2) {
      setError("Google OAuth client belum siap. Coba refresh halaman.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const state = createGoogleOAuthState();
      saveGoogleOAuthPendingRequest({
        state,
        intent,
        nextPath: sanitizeNextPath(nextPath, intent),
        createdAt: Date.now(),
      });

      const codeClient = googleOauth2.initCodeClient({
        client_id: GOOGLE_CLIENT_ID!,
        scope: GOOGLE_OAUTH_SCOPE,
        ux_mode: "redirect",
        redirect_uri: getGoogleOAuthRedirectUri(),
        state,
        include_granted_scopes: true,
      });

      codeClient.requestCode();
    } catch {
      setLoading(false);
      setError("Gagal memulai Google OAuth. Periksa konfigurasi client ID dan redirect URI.");
    }
  };

  return (
    <div className="space-y-2">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onReady={() => setScriptReady(true)}
        onError={() => setError("Gagal memuat Google OAuth script. Coba refresh halaman.")}
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={loading || !isConfigured}
        className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-surface-2 px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-70"
      >
        <GoogleMark />
        <span>{loading ? "Redirecting to Google..." : label}</span>
      </button>

      {helperText ? (
        <p className="text-center text-xs text-ink-muted">{helperText}</p>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
          {error}
        </div>
      ) : null}
    </div>
  );
}
