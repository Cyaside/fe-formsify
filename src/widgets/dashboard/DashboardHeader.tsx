"use client";

import Link from "next/link";
import ThemeToggle from "@/shared/theme/ThemeToggle";
import { useAuth } from "@/features/auth/AuthProvider";
import { useRouter } from "next/navigation";
import Button from "@/shared/ui/Button";
import DashboardMobileMenu from "./DashboardMobileMenu";

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const displayName = user?.name || user?.email || "Pengguna";

  return (
    <header className="mx-6 mt-6 flex flex-col gap-6 rounded-3xl border border-white/10 bg-surface/85 px-6 py-6 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-lavender/40 bg-page/70">
            <span className="absolute h-4 w-4 rounded-md border border-lavender/70 bg-violet" />
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-sun" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-lavender">
              Dashboard
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Overview cepat untuk aktivitas form kamu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <DashboardMobileMenu />
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink font-display md:text-3xl">
            Selamat datang kembali, {displayName}
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-page/60 px-4 py-2 text-sm text-ink-muted">
            <span className="h-2 w-2 rounded-full bg-lavender" />
            <span>Cari form, template, atau respon</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="secondary" size="sm">Back to Home</Button>
            </Link>
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
          </div>
        </div>
      </div>
    </header>
  );
}
