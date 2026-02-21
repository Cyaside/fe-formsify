"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNavItems } from "./navItems";

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 p-6 lg:flex lg:flex-col">
      <div className="sticky top-6 flex h-[calc(100vh-3rem)] flex-col gap-8 rounded-3xl border border-white/10 bg-surface/85 p-6 shadow-soft backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-lavender/40 bg-page/70">
            <span className="absolute h-4 w-4 rounded-md border border-lavender/70 bg-violet" />
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-sun" />
          </div>
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-lavender">
            Formsify
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 text-sm font-semibold text-ink-muted">
          {dashboardNavItems.map((item) => {
            const isActive = pathname === item.href;
            const isPlaceholder = item.href === "#" || item.disabled;
            const Icon = item.icon;

            return isPlaceholder ? (
              <button
                key={item.label}
                type="button"
                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-page/40 hover:text-ink ${
                  isActive ? "bg-page/50 text-ink" : ""
                }`}
              >
                <span className="flex items-center gap-2">
                  {Icon ? <Icon size={16} /> : null}
                  {item.label}
                </span>
                <span className="h-2 w-2 rounded-full bg-lavender/60" />
              </button>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-page/40 hover:text-ink ${
                  isActive ? "bg-page/50 text-ink" : ""
                }`}
              >
                <span className="flex items-center gap-2">
                  {Icon ? <Icon size={16} /> : null}
                  {item.label}
                </span>
                <span className="h-2 w-2 rounded-full bg-lavender/60" />
              </Link>
            );
          })}
        </div>
        <div className="rounded-3xl border border-lavender/20 bg-page/60 p-4 text-xs text-ink-muted">
          Upgrade ke Pro untuk akses logic lanjutan dan kolaborasi tim.
        </div>
      </div>
    </aside>
  );
}
