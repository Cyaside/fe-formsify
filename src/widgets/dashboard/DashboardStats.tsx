type DashboardStatItem = {
  label: string;
  value: string;
  meta?: string;
};

type DashboardStatsProps = {
  items: DashboardStatItem[];
};

export default function DashboardStats({ items }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-3xl border border-white/10 bg-surface/70 p-6 shadow-[0_14px_36px_rgba(10,8,24,0.3)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-muted">
            {item.label}
          </p>
          <div className="mt-4 flex items-end justify-between gap-4">
            <p className="text-3xl font-semibold text-ink font-display">{item.value}</p>
            {item.meta ? (
              <span className="rounded-full bg-page/70 px-3 py-1 text-xs font-semibold text-lavender">
                {item.meta}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
