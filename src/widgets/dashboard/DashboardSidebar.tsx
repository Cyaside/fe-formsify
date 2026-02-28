"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNavItems } from "./navItems";

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 p-6 lg:flex lg:flex-col">
      <div className="sticky top-6 flex h-[calc(100vh-3rem)] flex-col gap-8 rounded-3xl border border-border/40 bg-surface/75 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md">
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
                className={`flex items-center rounded-2xl px-4 py-3 text-left transition-all duration-200 ${
                  isActive
                    ? "bg-accent/10 text-ink ring-1 ring-accent/20"
                    : "text-ink-muted hover:bg-surface-2/70 hover:text-ink"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {Icon ? <Icon size={16} className={isActive ? "text-accent" : ""} /> : null}
                  {item.label}
                </span>
              </button>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center rounded-2xl px-4 py-3 text-left transition-all duration-200 ${
                  isActive
                    ? "bg-accent/10 text-ink ring-1 ring-accent/20"
                    : "text-ink-muted hover:bg-surface-2/70 hover:text-ink"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {Icon ? <Icon size={16} className={isActive ? "text-accent" : ""} /> : null}
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
