"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@/components/ui/Container";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
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
      const message = err instanceof ApiError ? err.message : "Gagal login. Coba lagi.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page text-ink">
      <Container className="flex min-h-screen items-center justify-center py-16">
        <div className="w-full max-w-md rounded-4xl border border-white/10 bg-surface/70 p-8 shadow-[0_24px_60px_rgba(8,6,20,0.4)]">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lavender">
              Login
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-ink font-display">
              Selamat datang kembali
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Masuk untuk mengelola form dan melihat dashboard kamu.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
              <span>Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@company.com"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none"
                required
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
              <span>Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimal 6 karakter"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none"
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
              className="mt-2 inline-flex items-center justify-center rounded-full bg-lavender px-6 py-3 text-sm font-semibold text-violet-deep transition hover:-translate-y-0.5 hover:bg-sun disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold text-lavender hover:text-sun">
              Register
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-ink-muted">
            <Link href="/" className="hover:text-ink">
              Kembali ke landing page
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}
