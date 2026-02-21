"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { dashboardNavItems } from "./navItems";

export default function DashboardMobileMenu() {
  const [open, setOpen] = useState(false);
  const items = dashboardNavItems.filter((item) => !item.disabled && item.href !== "#");

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-surface/70 text-ink transition hover:border-lavender/60 hover:text-lavender"
        aria-label="Open dashboard menu"
      >
        <Menu size={18} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-page/85 backdrop-blur-sm">
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl border border-white/10 bg-surface p-6 shadow-pop">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-lavender">
                Menu
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-surface/80 text-ink transition hover:border-lavender/60 hover:text-lavender"
                aria-label="Close dashboard menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-page/60 px-4 py-3 text-sm font-semibold text-ink transition hover:border-lavender/60 hover:text-lavender"
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
