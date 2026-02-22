"use client";

import Image from "next/image";
import ThemeToggle from "@/shared/theme/ThemeToggle";
import Container from "@/shared/ui/Container";

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
          <Image
            src="/logo.png"
            alt="Formsify logo"
            width={48}
            height={48}
            className="h-10 w-auto"
            priority
          />
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

