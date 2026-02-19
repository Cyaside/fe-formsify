"use client";

import ThemeToggle from "@/components/theme/ThemeToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const displayName = user?.name || user?.email || "Pengguna";

  return (
    <header className="flex flex-col gap-6 border-b border-white/10 bg-page/70 px-6 py-6 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-lavender">
          Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-ink font-display">
          Selamat datang kembali, {displayName}
        </h1>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-surface/70 px-4 py-2 text-sm text-ink-muted">
          <span className="h-2 w-2 rounded-full bg-lavender" />
          Cari form, template, atau respon
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/");
            }}
            className="rounded-full border border-lavender/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-lavender transition hover:bg-lavender hover:text-violet-deep"
          >
            Logout
          </button>
          <button
            type="button"
            className="rounded-full bg-lavender px-5 py-2 text-sm font-semibold text-violet-deep transition hover:-translate-y-0.5 hover:bg-sun"
          >
            Buat Form Baru
          </button>
        </div>
      </div>
    </header>
  );
}
