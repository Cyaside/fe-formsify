"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@/shared/ui/Container";
import { ApiError } from "@/shared/api/client";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  consumeGoogleOAuthPendingRequest,
  getDefaultNextPathForIntent,
} from "@/features/auth/googleOAuth";

function GoogleOAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithGoogle } = useAuth();

  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const googleError = searchParams.get("error");
    if (googleError) {
      Promise.resolve().then(() => {
        setError(
          googleError === "access_denied"
            ? "Google sign-in dibatalkan."
            : `Google OAuth error: ${googleError}`,
        );
      });
      return;
    }

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const pending = consumeGoogleOAuthPendingRequest(state);

    if (!code) {
      Promise.resolve().then(() => setError("Authorization code dari Google tidak ditemukan."));
      return;
    }

    if (!pending) {
      Promise.resolve().then(() =>
        setError("Session OAuth tidak valid/expired. Mulai login Google dari halaman login/register."),
      );
      return;
    }

    loginWithGoogle({ code })
      .then(() => {
        router.replace(pending.nextPath);
      })
      .catch((err) => {
        const message =
          err instanceof ApiError ? err.message : "Google sign-in gagal. Silakan coba lagi.";
        setError(message);
      });
  }, [loginWithGoogle, router, searchParams]);

  if (!error) {
    return (
      <div className="min-h-screen bg-page text-ink">
        <Container className="flex min-h-screen items-center justify-center py-16">
          <div className="w-full max-w-md rounded-4xl border border-border bg-surface p-8 text-center shadow-pop">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent">
              Google OAuth
            </p>
            <h1 className="mt-3 text-2xl font-semibold font-display text-ink">
              Menyelesaikan login...
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Sedang memverifikasi akun Google dan membuat session Anda.
            </p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page text-ink">
      <Container className="flex min-h-screen items-center justify-center py-16">
        <div className="w-full max-w-md rounded-4xl border border-border bg-surface p-8 shadow-pop">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent text-center">
            Google OAuth
          </p>
          <h1 className="mt-3 text-center text-2xl font-semibold font-display text-ink">
            Login Google gagal
          </h1>
          <div className="mt-4 rounded-2xl border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
            {error}
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={`/login?next=${encodeURIComponent(getDefaultNextPathForIntent("login"))}`}
              className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-900"
            >
              Kembali ke Login
            </Link>
            <Link href="/" className="text-center text-sm text-ink-muted hover:text-ink">
              Back to landing page
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function GoogleOAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-page text-ink">
          <Container className="flex min-h-screen items-center justify-center py-16">
            <div className="w-full max-w-md rounded-4xl border border-border bg-surface p-8 text-center text-sm text-ink-muted">
              Loading OAuth callback...
            </div>
          </Container>
        </div>
      }
    >
      <GoogleOAuthCallbackContent />
    </Suspense>
  );
}
