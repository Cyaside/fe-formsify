import Link from "next/link";
import { useMemo } from "react";

type FormSummary = {
  id: string;
  title: string;
  description?: string | null;
  updatedAt: string;
};

type DashboardFormsProps = {
  forms: FormSummary[];
  loading?: boolean;
  error?: string | null;
};

export default function DashboardForms({ forms, loading, error }: DashboardFormsProps) {
  const formattedForms = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
    return forms.map((form) => ({
      ...form,
      updatedLabel: formatter.format(new Date(form.updatedAt)),
    }));
  }, [forms]);

  return (
    <div className="rounded-3xl border border-white/10 bg-surface/70 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink font-display">Form Terbaru</h2>
        <Link
          href="/dashboard/forms"
          className="rounded-full border border-lavender/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-lavender transition hover:bg-lavender hover:text-violet-deep"
        >
          Lihat Semua
        </Link>
      </div>
      <div className="mt-6 grid gap-4">
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-page/70 p-4 text-sm text-ink-muted">
            Memuat form terbaru...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose/40 bg-rose/10 p-4 text-sm text-rose">
            {error}
          </div>
        ) : formattedForms.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-page/70 p-4 text-sm text-ink-muted">
            Belum ada form. Buat form baru untuk mulai.
          </div>
        ) : (
          formattedForms.map((form) => (
            <div
              key={form.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-page/70 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-ink">{form.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.28em] text-ink-muted">
                  Diupdate {form.updatedLabel}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-ink-muted">
                <span className="text-xs">{form.description || "Tanpa deskripsi"}</span>
                <Link
                  href="/dashboard/forms"
                  className="rounded-full bg-lavender px-4 py-2 text-xs font-semibold text-violet-deep transition hover:bg-sun"
                >
                  Buka
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
