"use client";

import ThemeToggle from "@/components/theme/ThemeToggle";
import Container from "@/components/ui/Container";

const navItems = [
  { label: "About", href: "#about" },
  { label: "Steps", href: "#steps" },
  { label: "Reviews", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
  { label: "Dashboard", href: "/dashboard" },
];

export default function SiteHeader() {
  return (
    <header className="absolute left-0 right-0 top-0 z-20">
      <Container className="flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-lavender/40 bg-surface/80">
            <span className="absolute h-4 w-4 rounded-md border border-lavender/70 bg-violet" />
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-sun" />
          </div>
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-lavender">
            Formsify
          </span>
        </div>
        <nav className="hidden items-center gap-6 text-xs font-semibold uppercase tracking-[0.25em] text-ink-muted md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition hover:text-lavender"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <ThemeToggle />
      </Container>
    </header>
  );
}

