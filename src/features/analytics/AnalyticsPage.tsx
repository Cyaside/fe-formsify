"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/widgets/dashboard/DashboardHeader";
import DashboardSidebar from "@/widgets/dashboard/DashboardSidebar";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import Select from "@/shared/ui/Select";
import { analyticsApi } from "@/shared/api/analytics";
import { ApiError } from "@/shared/api/client";
import RequireAuth from "@/features/auth/RequireAuth";
import TrendChart from "./components/TrendChart";
import { getRangeDates, rangeOptions } from "./lib/range";
import { buildTrendSeries } from "./lib/trend";
import DashboardMobileNav from "@/widgets/dashboard/DashboardMobileNav";

export default function AnalyticsPage() {
  const [rangeIndex, setRangeIndex] = useState(1);
  const range = rangeOptions[rangeIndex] ?? rangeOptions[1];

  const { from, to } = useMemo(() => getRangeDates(range.days), [range.days]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics", "global", from, to, range.bucket],
    queryFn: () => analyticsApi.global({ from, to, bucket: range.bucket }),
  });

  const errorMessage = useMemo(() => {
    if (!error) return null;
    return error instanceof ApiError ? error.message : "Failed to load analytics.";
  }, [error]);

  const totals = data?.data.totals;
  const bucket = data?.data.range.bucket ?? range.bucket;
  const rawTrend = useMemo(() => data?.data.responseTrend ?? [], [data]);
  const trend = useMemo(
    () => buildTrendSeries(rawTrend, from, to, bucket),
    [bucket, from, rawTrend, to],
  );

  return (
    <RequireAuth>
      <div className="min-h-screen bg-page text-ink">
        <div className="flex min-h-screen">
          <DashboardSidebar />
          <div className="flex flex-1 flex-col">
            <DashboardHeader />

            <main className="flex-1 space-y-6 px-6 py-8 pb-24">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-lavender">
                    Analytics
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">Global Analytics</h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    Aggregate metrics across all forms you own.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(rangeIndex)}
                    onChange={(event) => setRangeIndex(Number(event.target.value))}
                    className="min-w-35"
                  >
                    {rangeOptions.map((option, index) => (
                      <option key={option.label} value={index}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  <Button variant="secondary" onClick={() => refetch()}>
                    Refresh
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <Card className="text-sm text-ink-muted">Loading analytics...</Card>
              ) : null}
              {errorMessage ? (
                <Card className="border-rose/40 bg-rose/10 text-sm text-rose">
                  {errorMessage}
                </Card>
              ) : null}

              {!isLoading && !errorMessage ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.24em] text-ink-muted">
                        Total Forms
                      </p>
                      <p className="text-3xl font-semibold">
                        {totals?.forms ?? 0}
                      </p>
                      <p className="text-xs text-ink-muted">Across your account</p>
                    </Card>
                    <Card className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.24em] text-ink-muted">
                        Total Responses
                      </p>
                      <p className="text-3xl font-semibold">
                        {totals?.responses ?? 0}
                      </p>
                      <p className="text-xs text-ink-muted">All submissions recorded</p>
                    </Card>
                  </div>

                  <Card className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-ink-muted">
                        Response Trend
                      </p>
                      <h3 className="mt-2 text-lg font-semibold">
                        Responses over time
                      </h3>
                      <p className="text-xs text-ink-muted">
                        {from} to {to} · Bucket: {bucket}
                      </p>
                    </div>

                    <TrendChart data={trend} bucket={bucket} />
                  </Card>
                </>
              ) : null}
            </main>
          </div>
        </div>
        <DashboardMobileNav />
      </div>
    </RequireAuth>
  );
}
