"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@/shared/ui/Container";
import { ApiError } from "@/shared/api/client";
import { useAuth } from "@/features/auth/AuthProvider";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const { register, user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace(next);
    }
  }, [next, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password);
      router.replace(next);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Gagal register. Coba lagi.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page text-ink">
      <Container className="flex min-h-screen items-center justify-center py-16">
        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-surface/70 p-8 shadow-[0_24px_60px_rgba(8,6,20,0.4)]">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lavender">
              Register
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-ink font-display">
              Buat akun Formsify
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Mulai bangun form yang rapi dan terukur.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
              Nama
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nama lengkap"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
              Email
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
              Password
              <input
                type="password"
                name="password"
                autoComplete="new-password"
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
              {loading ? "Membuat akun..." : "Daftar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-lavender hover:text-sun">
              Login
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-page text-ink">
          <Container className="flex min-h-screen items-center justify-center py-16">
            <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-surface/70 p-8 text-center text-sm text-ink-muted">
              Loading...
            </div>
          </Container>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
