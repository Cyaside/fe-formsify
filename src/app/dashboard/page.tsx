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
import { ApiError } from "@/shared/api/client";
import { formsApi } from "@/shared/api/forms";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["forms", "mine", user?.id],
    queryFn: () => formsApi.list(),
    enabled: Boolean(user),
  });

  const forms = data?.data ?? [];
  const errorMessage = useMemo(() => {
    if (!error) return null;
    return error instanceof ApiError ? error.message : "Gagal memuat form.";
  }, [error]);

  const latestForms = forms.slice(0, 4);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-page text-ink">
        <div className="flex min-h-screen">
          <DashboardSidebar />
          <div className="flex flex-1 flex-col">
            <DashboardHeader />
            <main className="flex-1 space-y-8 px-6 py-8 pb-24">
              <DashboardStats />
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <DashboardForms
                  forms={latestForms}
                  loading={isLoading}
                  error={errorMessage}
                />
                <DashboardActivity />
              </div>
            </main>
          </div>
        </div>
        <DashboardMobileNav />
      </div>
    </RequireAuth>
  );
}
