"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type FormStatusDatum = {
  label: string;
  value: number;
  color: string;
};

type FormStatusPieChartProps = {
  data: FormStatusDatum[];
};

const formatNumber = (value: number) => new Intl.NumberFormat("id-ID").format(value);

export default function FormStatusPieChart({ data }: FormStatusPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const summary = data.map((item) => ({
    ...item,
    percent: total > 0 ? Math.round((item.value / total) * 100) : 0,
  }));

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface-2 p-4 text-sm text-ink-muted">
        Belum ada data form untuk ditampilkan.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={summary}
              dataKey="value"
              nameKey="label"
              innerRadius={58}
              outerRadius={90}
              paddingAngle={3}
            >
              {summary.map((entry) => (
                <Cell
                  key={entry.label}
                  fill={entry.color}
                  stroke="var(--background)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, payload) => {
                const safeValue = typeof value === "number" ? value : 0;
                const percent = payload?.payload?.percent as number | undefined;
                const suffix = percent ? `(${percent}%)` : "";
                return [`${formatNumber(safeValue)} ${suffix}`.trim(), "Forms"];
              }}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--ink)",
                fontSize: 12,
              }}
              wrapperStyle={{ zIndex: 1000 }}
              labelStyle={{ color: "var(--ink)", fontSize: 12, fontWeight: 600 }}
              itemStyle={{ color: "var(--ink)", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3 text-sm text-ink-muted">
        {summary.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-ink">{item.label}</span>
            </div>
            <span>
              {formatNumber(item.value)} ({item.percent}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
