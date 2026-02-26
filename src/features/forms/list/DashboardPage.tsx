"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardActivity from "@/widgets/dashboard/DashboardActivity";
import DashboardForms from "@/widgets/dashboard/DashboardForms";
import DashboardHeader from "@/widgets/dashboard/DashboardHeader";
import DashboardMobileNav from "@/widgets/dashboard/DashboardMobileNav";
import DashboardSidebar from "@/widgets/dashboard/DashboardSidebar";
import DashboardStats from "@/widgets/dashboard/DashboardStats";
import RequireAuth from "@/features/auth/RequireAuth";
import { useAuth } from "@/features/auth/AuthProvider";
import { analyticsApi } from "@/shared/api/analytics";
import { ApiError } from "@/shared/api/client";
import { formsApi } from "@/shared/api/forms";

const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

const getMonthRange = () => {
  const today = new Date();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(1);
  return {
    from: toDateInput(start),
    to: toDateInput(end),
    start,
    end,
    label: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
      today,
    ),
  };
};

const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat("en-US", options).format(value);

const formatRelativeTime = (date: Date) => {
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

  if (abs < minute) return rtf.format(Math.round(diff / 1000), "second");
  if (abs < hour) return rtf.format(Math.round(diff / minute), "minute");
  if (abs < day) return rtf.format(Math.round(diff / hour), "hour");
  if (abs < 7 * day) return rtf.format(Math.round(diff / day), "day");

  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: formsData, isLoading: formsLoading, error: formsError } = useQuery({
    queryKey: ["forms", "mine", user?.id],
    queryFn: () => formsApi.list(),
    enabled: Boolean(user),
  });

  const monthRange = useMemo(() => getMonthRange(), []);

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useQuery({
    queryKey: ["analytics", "global", "month", monthRange.from, monthRange.to],
    queryFn: () =>
      analyticsApi.global({ from: monthRange.from, to: monthRange.to, bucket: "day" }),
    enabled: Boolean(user),
  });

  const forms = useMemo(() => formsData?.data ?? [], [formsData?.data]);
  const formsErrorMessage = useMemo(() => {
    if (!formsError) return null;
    return formsError instanceof ApiError ? formsError.message : "Failed to load forms.";
  }, [formsError]);

  const analyticsErrorMessage = useMemo(() => {
    if (!analyticsError) return null;
    return analyticsError instanceof ApiError
      ? analyticsError.message
      : "Failed to load analytics.";
  }, [analyticsError]);

  const sortedForms = useMemo(() => {
    return [...forms].sort((a, b) => {
      const next = new Date(b.updatedAt).getTime();
      const prev = new Date(a.updatedAt).getTime();
      return next - prev;
    });
  }, [forms]);

  const latestForms = sortedForms.slice(0, 4);

  const formMetrics = useMemo(() => {
    const totalForms = forms.length;
    const activeForms = forms.filter((form) => form.isPublished).length;
    const draftForms = totalForms - activeForms;
    const newFormsThisMonth = forms.filter((form) => {
      if (!form.createdAt) return false;
      const createdAt = new Date(form.createdAt);
      return createdAt >= monthRange.start && createdAt <= monthRange.end;
    }).length;

    return {
      totalForms,
      activeForms,
      draftForms,
      newFormsThisMonth,
    };
  }, [forms, monthRange.end, monthRange.start]);

  const formsReady = !formsLoading && !formsErrorMessage;
  const analyticsReady = !analyticsLoading && !analyticsErrorMessage;

  const totalFormsLabel = formatNumber(formMetrics.totalForms);
  const stats = [
    {
      label: "Active Forms",
      value: formsReady ? formatNumber(formMetrics.activeForms) : "-",
      meta: formsReady ? `${totalFormsLabel} total` : "Loading...",
    },
    {
      label: "Responses This Month",
      value: analyticsReady
        ? formatNumber(analyticsData?.data.totals.responses ?? 0, {
            notation: "compact",
            maximumFractionDigits: 1,
          })
        : "-",
      meta: analyticsReady ? monthRange.label : "Loading...",
    },
    {
      label: "New Forms This Month",
      value: formsReady ? formatNumber(formMetrics.newFormsThisMonth) : "-",
      meta: formsReady ? monthRange.label : "Loading...",
    },
    {
      label: "Draft Forms",
      value: formsReady ? formatNumber(formMetrics.draftForms) : "-",
      meta: formsReady ? `${totalFormsLabel} total` : "Loading...",
    },
  ];

  const latestResponse = useMemo(() => {
    const trend = analyticsData?.data.responseTrend ?? [];
    for (let i = trend.length - 1; i >= 0; i -= 1) {
      if (trend[i].count > 0) {
        return trend[i];
      }
    }
    return null;
  }, [analyticsData?.data.responseTrend]);

  const activityItems = useMemo(() => {
    const items: Array<{ title: string; detail: string; time: string }> = [];

    if (analyticsReady) {
      if (latestResponse) {
        items.push({
          title: "Latest Responses",
          detail: `${formatNumber(latestResponse.count)} responses received`,
          time: formatRelativeTime(new Date(latestResponse.date)),
        });
      } else {
        items.push({
          title: "Responses This Month",
          detail: "No responses received yet.",
          time: monthRange.label,
        });
      }
    }

    if (formsReady) {
      sortedForms.slice(0, 2).forEach((form) => {
        items.push({
          title: form.title,
          detail: form.isPublished ? "Form published or updated" : "Draft updated",
          time: formatRelativeTime(new Date(form.updatedAt)),
        });
      });

      if (items.length < 3 && formMetrics.draftForms > 0) {
        items.push({
          title: "Needs Publishing",
          detail: `${formatNumber(formMetrics.draftForms)} forms are still drafts`,
          time: "Now",
        });
      }
    }

    return items.slice(0, 3);
  }, [
    analyticsReady,
    formMetrics.draftForms,
    formsReady,
    latestResponse,
    monthRange.label,
    sortedForms,
  ]);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-page text-ink">
        <div className="flex min-h-screen">
          <DashboardSidebar />
          <div className="flex flex-1 flex-col">
            <DashboardHeader />
            <main className="flex-1 space-y-8 px-6 py-8 pb-24">
              <DashboardStats items={stats} />
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <DashboardForms
                  forms={latestForms}
                  loading={formsLoading}
                  error={formsErrorMessage}
                />
                <DashboardActivity
                  items={activityItems}
                  loading={formsLoading || analyticsLoading}
                  error={formsErrorMessage ?? analyticsErrorMessage}
                />
              </div>
            </main>
          </div>
        </div>
        <DashboardMobileNav />
      </div>
    </RequireAuth>
  );
}
