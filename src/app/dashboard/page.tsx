"use client";

import { useEffect, useState } from "react";
import DashboardActivity from "@/components/sections/dashboard/DashboardActivity";
import DashboardForms from "@/components/sections/dashboard/DashboardForms";
import DashboardHeader from "@/components/sections/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/sections/dashboard/DashboardSidebar";
import DashboardStats from "@/components/sections/dashboard/DashboardStats";
import RequireAuth from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiRequest, ApiError } from "@/lib/api";

type FormSummary = {
  id: string;
  title: string;
  description?: string | null;
  updatedAt: string;
  createdAt: string;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    apiRequest<{ data: FormSummary[] }>("/api/forms")
      .then((data) => {
        setForms(data.data);
      })
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Gagal memuat form.";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const latestForms = forms.slice(0, 4);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-page text-ink">
        <div className="flex min-h-screen">
          <DashboardSidebar />
          <div className="flex flex-1 flex-col">
            <DashboardHeader />
            <main className="flex-1 space-y-8 px-6 py-8">
              <DashboardStats />
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <DashboardForms forms={latestForms} loading={loading} error={error} />
                <DashboardActivity />
              </div>
            </main>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
