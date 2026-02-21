"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNavItems } from "./navItems";

export default function DashboardMobileNav() {
  const pathname = usePathname();
  const items = dashboardNavItems.filter((item) => !item.disabled && item.href !== "#");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-surface/90 shadow-soft backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-around px-4 py-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                isActive ? "text-lavender" : "text-ink-muted"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {Icon ? <Icon size={18} /> : null}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
