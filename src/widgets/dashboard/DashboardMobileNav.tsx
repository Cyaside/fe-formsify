"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNavItems } from "./navItems";

export default function DashboardMobileNav() {
  const pathname = usePathname();
  const items = dashboardNavItems.filter((item) => !item.disabled && item.href !== "#");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface shadow-soft lg:hidden">
      <div className="mx-auto flex max-w-6xl items-center px-2 py-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`min-w-0 flex-1 basis-0 rounded-xl px-2 py-2 text-center text-[9px] font-semibold uppercase tracking-[0.12em] ${
                isActive ? "text-accent" : "text-ink-muted"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="flex justify-center">{Icon ? <Icon size={18} /> : null}</span>
              <span className="block truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
