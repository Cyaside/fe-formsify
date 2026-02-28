import { apiRequest } from "@/shared/api/client";

export type AnalyticsTrendPoint = {
  date: string;
  count: number;
};

export type AnalyticsRange = {
  from: string;
  to: string;
  bucket: "day" | "week" | "month";
};

export type GlobalAnalyticsResponse = {
  data: {
    totals: {
      forms: number;
      responses: number;
    };
    responseTrend: AnalyticsTrendPoint[];
    latestResponseAt: string | null;
    range: AnalyticsRange;
  };
};

export const analyticsApi = {
  global: (params?: { from?: string; to?: string; bucket?: "day" | "week" | "month" }) => {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    if (params?.bucket) searchParams.set("bucket", params.bucket);
    const query = searchParams.toString();
    const path = query ? `/api/analytics/global?${query}` : "/api/analytics/global";
    return apiRequest<GlobalAnalyticsResponse>(path);
  },
};
