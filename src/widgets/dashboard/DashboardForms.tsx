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

  const getContent = () => {
    if (loading) {
      return (
        <div className="rounded-2xl border border-border bg-surface-2 p-4 text-sm text-ink-muted">
          Memuat form terbaru...
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-2xl border border-rose/40 bg-rose/10 p-4 text-sm text-rose">
          {error}
        </div>
      );
    }

    if (formattedForms.length === 0) {
      return (
        <div className="rounded-2xl border border-border bg-surface-2 p-4 text-sm text-ink-muted">
          Belum ada form. Buat form baru untuk mulai.
        </div>
      );
    }

    return formattedForms.map((form) => (
      <div
        key={form.id}
        className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-2 p-4 md:flex-row md:items-center md:justify-between"
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
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-900"
          >
            Buka
          </Link>
        </div>
      </div>
    ));
  };

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink font-display">Form Terbaru</h2>
        <Link
          href="/dashboard/forms"
          className="rounded-full border border-accent/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent transition-colors hover:bg-accent hover:text-white"
        >
          Lihat Semua
        </Link>
      </div>
      <div className="mt-6 grid gap-4">
        {getContent()}
      </div>
    </div>
  );
}
