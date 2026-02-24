"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNavItems } from "./navItems";

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 p-6 lg:flex lg:flex-col">
      <div className="sticky top-6 flex h-[calc(100vh-3rem)] flex-col gap-8 rounded-3xl border border-border bg-surface p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Formsify"
            width={180}
            height={48}
            className="h-10 w-auto"
            priority
          />
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
                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left transition-colors hover:bg-surface-2 hover:text-ink ${
                  isActive ? "bg-surface-2 text-ink" : ""
                }`}
              >
                <span className="flex items-center gap-2">
                  {Icon ? <Icon size={16} /> : null}
                  {item.label}
                </span>
                <span className="h-2 w-2 rounded-full bg-accent/70" />
              </button>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left transition-colors hover:bg-surface-2 hover:text-ink ${
                  isActive ? "bg-surface-2 text-ink" : ""
                }`}
              >
                <span className="flex items-center gap-2">
                  {Icon ? <Icon size={16} /> : null}
                  {item.label}
                </span>
                <span className="h-2 w-2 rounded-full bg-accent/70" />
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
