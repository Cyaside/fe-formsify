"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@/shared/ui/Container";
import { ApiError } from "@/shared/api/client";
import { useAuth } from "@/features/auth/AuthProvider";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const { login, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace(next);
    }
  }, [next, router, user]);

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.replace(next);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Login failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page text-ink">
      <Container className="flex min-h-screen items-center justify-center py-16">
        <div className="w-full max-w-md rounded-4xl border border-border bg-surface p-8 shadow-pop">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent">
              Login
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-ink font-display">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Sign in to manage forms and view your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
              <span>Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@company.com"
                className="mt-3 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/25"
                required
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
              <span>Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 6 characters"
                className="mt-3 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/25"
                required
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Processing..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold text-accent hover:text-accent-900">
              Register
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-ink-muted">
            <Link href="/" className="hover:text-ink">
              Back to landing page
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-page text-ink">
          <Container className="flex min-h-screen items-center justify-center py-16">
            <div className="w-full max-w-md rounded-4xl border border-border bg-surface p-8 text-center text-sm text-ink-muted">
              Loading...
            </div>
          </Container>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
