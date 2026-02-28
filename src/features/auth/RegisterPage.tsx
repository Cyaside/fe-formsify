"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@/shared/ui/Container";
import { ApiError } from "@/shared/api/client";
import { useAuth } from "@/features/auth/AuthProvider";
import GoogleSignInButton from "@/features/auth/GoogleSignInButton";
import { sanitizeNextPath } from "@/features/auth/googleOAuth";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNextPath(searchParams.get("next"), "register");
  const { register, user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      router.replace(next);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Registration failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page text-ink">
      <Container className="flex min-h-screen items-center justify-center py-16">
        <div className="w-full max-w-md rounded-[32px] border border-border bg-surface p-8 shadow-pop">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent">
              Register
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-ink font-display">
              Create a Formsify account
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Start building forms with a clean and measurable workflow.
            </p>
          </div>

          <GoogleSignInButton intent="register" nextPath={next} />

          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
              Or sign up with email
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
              Name
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your display name"
                className="mt-3 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/25"
                required
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
              Email
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
              Password
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 6 characters"
                className="mt-3 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/25"
                required
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
              Confirm Password
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat your password"
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
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-accent hover:text-accent-900">
              Login
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-page text-ink">
          <Container className="flex min-h-screen items-center justify-center py-16">
            <div className="w-full max-w-md rounded-[32px] border border-border bg-surface p-8 text-center text-sm text-ink-muted">
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
