const navItems = [
  { label: "Overview" },
  { label: "Forms" },
  { label: "Templates" },
  { label: "Responses" },
  { label: "Integrations" },
  { label: "Settings" },
];

export default function DashboardSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-surface/80 p-6 lg:flex lg:flex-col">
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-lavender/40 bg-page/70">
          <span className="absolute h-4 w-4 rounded-md border border-lavender/70 bg-violet" />
          <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-sun" />
        </div>
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-lavender">
          Formsify
        </span>
      </div>
      <div className="mt-10 flex flex-1 flex-col gap-2 text-sm font-semibold text-ink-muted">
        {navItems.map((item, index) => (
          <button
            key={item.label}
            type="button"
            className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-page/40 hover:text-ink ${
              index === 0 ? "bg-page/50 text-ink" : ""
            }`}
          >
            <span>{item.label}</span>
            <span className="h-2 w-2 rounded-full bg-lavender/60" />
          </button>
        ))}
      </div>
      <div className="rounded-3xl border border-lavender/30 bg-page/60 p-4 text-xs text-ink-muted">
        Upgrade ke Pro untuk akses logic lanjutan dan kolaborasi tim.
      </div>
    </aside>
  );
}
