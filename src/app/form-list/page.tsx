"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import { apiRequest, ApiError } from "@/lib/api";

type PublicFormSummary = {
  id: string;
  title: string;
  description?: string | null;
  updatedAt: string;
  createdAt: string;
  owner?: {
    id: string;
    email: string;
    name?: string | null;
  } | null;
};

export default function PublicFormListPage() {
  const [forms, setForms] = useState<PublicFormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiRequest<{ data: PublicFormSummary[] }>("/api/forms/public")
      .then((data) => {
        setForms(data.data);
      })
      .catch((err) => {
        const message =
          err instanceof ApiError ? err.message : "Gagal memuat daftar form.";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const formattedForms = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
    return forms.map((form) => ({
      ...form,
      updatedLabel: formatter.format(new Date(form.updatedAt)),
      ownerLabel: form.owner?.name || form.owner?.email || "Anonymous",
    }));
  }, [forms]);

  return (
    <div className="min-h-screen bg-page text-ink">
      <header className="border-b border-white/10 bg-surface/70 py-8">
        <Container className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lavender">
              Form List
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-ink font-display">
              Jelajahi form publik
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Kumpulan semua form yang dibuat oleh pengguna Formsify.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-ink-muted transition hover:text-ink"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-lavender/40 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-lavender transition hover:bg-lavender hover:text-violet-deep"
            >
              Register
            </Link>
          </div>
        </Container>
      </header>

      <Container className="py-12">
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-surface/70 p-6 text-sm text-ink-muted">
            Memuat daftar form publik...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose/40 bg-rose/10 p-6 text-sm text-rose">
            {error}
          </div>
        ) : formattedForms.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-surface/70 p-6 text-sm text-ink-muted">
            Belum ada form publik yang tersedia.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {formattedForms.map((form) => (
              <div
                key={form.id}
                className="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-surface/70 p-6"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{form.title}</p>
                  <p className="mt-2 text-sm text-ink-muted">
                    {form.description || "Tanpa deskripsi"}
                  </p>
                  <p className="mt-4 text-xs uppercase tracking-[0.28em] text-ink-muted">
                    Oleh {form.ownerLabel}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.28em] text-lavender">
                  <span>Diupdate {form.updatedLabel}</span>
                  <Link
                    href={`/form-list/${form.id}`}
                    className="text-ink-muted hover:text-ink"
                  >
                    Lihat Detail
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
