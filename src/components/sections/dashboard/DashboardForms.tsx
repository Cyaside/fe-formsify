const forms = [
  { name: "Lead Capture Q1", status: "Live", responses: "482", updated: "2 jam lalu" },
  { name: "Event Registration", status: "Draft", responses: "98", updated: "Kemarin" },
  { name: "Product Feedback", status: "Live", responses: "1.2K", updated: "3 hari lalu" },
  { name: "Hiring Intake", status: "Paused", responses: "214", updated: "1 minggu lalu" },
];

export default function DashboardForms() {
  return (
    <div className="rounded-3xl border border-white/10 bg-surface/70 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink font-display">Form Terbaru</h2>
        <button
          type="button"
          className="rounded-full border border-lavender/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-lavender transition hover:bg-lavender hover:text-violet-deep"
        >
          Lihat Semua
        </button>
      </div>
      <div className="mt-6 grid gap-4">
        {forms.map((form) => (
          <div
            key={form.name}
            className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-page/70 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-ink">{form.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.28em] text-ink-muted">
                {form.updated}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-ink-muted">
              <span className="rounded-full bg-page/80 px-3 py-1 text-xs font-semibold text-ink">
                {form.status}
              </span>
              <span className="text-sm">{form.responses} responses</span>
              <button
                type="button"
                className="rounded-full bg-lavender px-4 py-2 text-xs font-semibold text-violet-deep transition hover:bg-sun"
              >
                Buka
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
