"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsTrendPoint } from "@/shared/api/analytics";
import type { TrendBucket } from "../lib/trend";

const formatDateLabel = (value: string, bucket: TrendBucket) => {
  const date = new Date(value);
  if (bucket === "month") {
    return new Intl.DateTimeFormat("id-ID", { month: "short", year: "2-digit" }).format(
      date,
    );
  }
  if (bucket === "week") {
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(
      date,
    );
  }
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(date);
};

type TrendChartProps = {
  data: AnalyticsTrendPoint[];
  bucket: TrendBucket;
};

export default function TrendChart({ data, bucket }: TrendChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatDateLabel(String(value), bucket)}
            tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
          />
          <Tooltip
            cursor={{ stroke: "rgba(202,166,255,0.5)", strokeWidth: 1 }}
            formatter={(value) => [typeof value === "number" ? value : 0, "Responses"]}
            labelFormatter={(label) => formatDateLabel(String(label), bucket)}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--ink)",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--lavender)"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
