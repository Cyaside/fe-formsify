const activities = [
  {
    title: "Lead Capture Q1",
    detail: "42 respon baru masuk",
    time: "5 menit lalu",
  },
  {
    title: "Event Registration",
    detail: "Template diperbarui",
    time: "1 jam lalu",
  },
  {
    title: "Hiring Intake",
    detail: "Integrasi Slack aktif",
    time: "Kemarin",
  },
];

export default function DashboardActivity() {
  return (
    <div className="rounded-3xl border border-white/10 bg-surface/70 p-6">
      <h2 className="text-lg font-semibold text-ink font-display">Aktivitas Terbaru</h2>
      <div className="mt-6 grid gap-4">
        {activities.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-white/10 bg-page/60 p-4"
          >
            <p className="text-sm font-semibold text-ink">{item.title}</p>
            <p className="mt-2 text-sm text-ink-muted">{item.detail}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.3em] text-lavender">
              {item.time}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
