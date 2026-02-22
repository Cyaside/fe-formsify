type ActivityItem = {
  title: string;
  detail: string;
  time: string;
};

type DashboardActivityProps = {
  items: ActivityItem[];
  loading?: boolean;
  error?: string | null;
};

export default function DashboardActivity({
  items,
  loading = false,
  error,
}: DashboardActivityProps) {
  const renderContent = () => {
    if (loading && items.length === 0) {
      return (
        <div className="rounded-2xl border border-white/10 bg-page/60 p-4 text-sm text-ink-muted">
          Memuat aktivitas terbaru...
        </div>
      );
    }

    if (error && items.length === 0) {
      return (
        <div className="rounded-2xl border border-rose/40 bg-rose/10 p-4 text-sm text-rose">
          {error}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="rounded-2xl border border-white/10 bg-page/60 p-4 text-sm text-ink-muted">
          Belum ada aktivitas yang bisa ditampilkan.
        </div>
      );
    }

    return items.map((item) => (
      <div
        key={`${item.title}-${item.time}`}
        className="rounded-2xl border border-white/10 bg-page/60 p-4"
      >
        <p className="text-sm font-semibold text-ink">{item.title}</p>
        <p className="mt-2 text-sm text-ink-muted">{item.detail}</p>
        <p className="mt-3 text-xs uppercase tracking-[0.3em] text-lavender">
          {item.time}
        </p>
      </div>
    ));
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-surface/70 p-6">
      <h2 className="text-lg font-semibold text-ink font-display">Aktivitas Terbaru</h2>
      <div className="mt-6 grid gap-4">
        {renderContent()}
      </div>
    </div>
  );
}
