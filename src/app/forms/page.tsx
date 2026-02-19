"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import RequireAuth from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiRequest, ApiError } from "@/lib/api";

type FormSummary = {
  id: string;
  title: string;
  description?: string | null;
  updatedAt: string;
  createdAt: string;
};

export default function FormsPage() {
  const { token, logout } = useAuth();
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    apiRequest<{ data: FormSummary[] }>("/api/forms", { token })
      .then((data) => {
        setForms(data.data);
      })
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Gagal memuat form.";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const formattedForms = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
    return forms.map((form) => ({
      ...form,
      updatedLabel: formatter.format(new Date(form.updatedAt)),
    }));
  }, [forms]);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-page text-ink">
        <header className="border-b border-white/10 bg-surface/70 py-8">
          <Container className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lavender">
                Form List
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-ink font-display">
                Daftar form kamu
              </h1>
              <p className="mt-2 text-sm text-ink-muted">
                Semua form yang kamu buat ada di sini.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-full border border-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-ink-muted transition hover:text-ink"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-lavender/40 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-lavender transition hover:bg-lavender hover:text-violet-deep"
              >
                Logout
              </button>
            </div>
          </Container>
        </header>

        <Container className="py-12">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-surface/70 p-6 text-sm text-ink-muted">
              Memuat daftar form...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-rose/40 bg-rose/10 p-6 text-sm text-rose">
              {error}
            </div>
          ) : formattedForms.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-surface/70 p-6 text-sm text-ink-muted">
              Belum ada form. Buat form baru dari dashboard.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {formattedForms.map((form) => (
                <div
                  key={form.id}
                  className="flex flex-col justify-between rounded-3xl border border-white/10 bg-surface/70 p-6"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{form.title}</p>
                    <p className="mt-2 text-sm text-ink-muted">
                      {form.description || "Tanpa deskripsi"}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.28em] text-lavender">
                    <span>Diupdate {form.updatedLabel}</span>
                    <Link href="/dashboard" className="text-ink-muted hover:text-ink">
                      Buka
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </div>
    </RequireAuth>
  );
}
