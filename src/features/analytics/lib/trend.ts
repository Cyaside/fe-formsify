import type { AnalyticsTrendPoint } from "@/shared/api/analytics";

export type TrendBucket = "day" | "week" | "month";

const parseDateOnly = (value: string) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setUTCHours(0, 0, 0, 0);
  return next;
};

const startOfWeek = (date: Date) => {
  const next = startOfDay(date);
  const day = next.getUTCDay();
  const diff = (day + 6) % 7;
  next.setUTCDate(next.getUTCDate() - diff);
  return next;
};

const startOfMonth = (date: Date) => {
  const next = startOfDay(date);
  next.setUTCDate(1);
  return next;
};

const normalizeBucket = (date: Date, bucket: TrendBucket) => {
  if (bucket === "week") return startOfWeek(date);
  if (bucket === "month") return startOfMonth(date);
  return startOfDay(date);
};

const addBucket = (date: Date, bucket: TrendBucket) => {
  const next = new Date(date);
  if (bucket === "month") {
    next.setUTCMonth(next.getUTCMonth() + 1);
    return next;
  }
  if (bucket === "week") {
    next.setUTCDate(next.getUTCDate() + 7);
    return next;
  }
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
};

export const buildTrendSeries = (
  points: AnalyticsTrendPoint[],
  from: string,
  to: string,
  bucket: TrendBucket,
) => {
  const fromDate = parseDateOnly(from);
  const toDate = parseDateOnly(to);
  if (!fromDate || !toDate) return points;

  const start = normalizeBucket(fromDate, bucket);
  const end = normalizeBucket(toDate, bucket);

  const pointMap = new Map<string, number>();
  points.forEach((point) => {
    const bucketDate = normalizeBucket(new Date(point.date), bucket);
    pointMap.set(bucketDate.toISOString(), point.count);
  });

  const series: AnalyticsTrendPoint[] = [];
  let cursor = start;
  while (cursor <= end) {
    const key = cursor.toISOString();
    series.push({ date: key, count: pointMap.get(key) ?? 0 });
    cursor = addBucket(cursor, bucket);
  }

  return series;
};
