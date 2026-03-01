"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import BubbleMenu from "@/widgets/landing/components/reactbits/BubbleMenu";
import Link from "next/link";
import ThemeToggle from "@/shared/theme/ThemeToggle";
import { useAuth } from "@/features/auth/AuthProvider";

const NAV_ITEMS = [
  { id: "top", label: "Home" },
  { id: "about", label: "About" },
  { id: "steps", label: "Steps" },
  { id: "testimonials", label: "Reviews" },
  { id: "contact", label: "Contact" },
];

export default function Navbar() {
  const [activeSection, setActiveSection] = useState<string>("top");
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const sections = NAV_ITEMS.map((item) => ({
        id: item.id,
        element: document.getElementById(item.id),
      }));

      const currentSection = sections.find((section) => {
        if (!section.element) return false;
        const rect = section.element.getBoundingClientRect();
        return rect.top <= 120 && rect.bottom >= 120;
      });

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const handleScrollToSection = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const mobileMenuItems = [
    ...NAV_ITEMS.map((item, index) => ({
      label: item.label,
      href: `#${item.id}`,
      ariaLabel: item.label,
      rotation: index % 2 === 0 ? -6 : 6,
      hoverStyles: {
        bgColor: "#6d28d9",
        textColor: "#ffffff",
      },
      onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        handleScrollToSection(item.id);
      },
    })),
    ...(user
      ? [
          {
            label: "Dashboard",
            href: "/dashboard",
            ariaLabel: "Dashboard",
            rotation: -8,
            baseStyles: { bgColor: "#14532d", textColor: "#dcfce7" },
            hoverStyles: { bgColor: "#16a34a", textColor: "#ffffff" },
          },
        ]
      : [
          {
            label: "Login",
            href: "/login",
            ariaLabel: "Login",
            rotation: 8,
            baseStyles: { bgColor: "#1f2937", textColor: "#f8fafc" },
            hoverStyles: { bgColor: "#334155", textColor: "#ffffff" },
          },
          {
            label: "Register",
            href: "/register",
            ariaLabel: "Register",
            rotation: -8,
            baseStyles: { bgColor: "#4c1d95", textColor: "#ede9fe" },
            hoverStyles: { bgColor: "#6d28d9", textColor: "#ffffff" },
          },
        ]),
  ];

  return (
    <>
      <nav className="fixed top-6 left-1/2 z-50 hidden -translate-x-1/2 md:block">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-full border border-border bg-surface px-6 py-3 shadow-soft"
        >
          <div className="flex items-center gap-6">
            <ul className="flex items-center gap-4">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleScrollToSection(item.id)}
                      className={`relative rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] transition ${
                        isActive
                          ? "text-accent"
                          : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      {isActive ? (
                        <motion.span
                          layoutId="activeSection"
                          className="absolute inset-0 rounded-full bg-accent-100 dark:bg-accent/10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      ) : null}
                      <span className="relative z-10">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-full border border-accent/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent transition-colors hover:bg-accent hover:text-white"
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-full border border-accent/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent transition-colors hover:bg-accent hover:text-white"
                >
                  Register
                </Link>
              </div>
            )}
            <ThemeToggle />
          </div>
        </motion.div>
      </nav>

      <div className="md:hidden">
        <div className="fixed top-5 right-[5.5rem] z-[101]">
          <ThemeToggle />
        </div>

        <BubbleMenu
          useFixedPosition
          menuAriaLabel="Open mobile navigation"
          menuBg="var(--surface)"
          menuContentColor="var(--ink)"
          style={{ top: "1.25rem", padding: "0 1rem", zIndex: 100 }}
          items={mobileMenuItems}
          logo={
            <Link
              href="#top"
              onClick={(event) => {
                event.preventDefault();
                handleScrollToSection("top");
              }}
              className="text-xs font-semibold uppercase tracking-[0.22em] text-ink"
            >
              Formsify
            </Link>
          }
        />
      </div>
    </>
  );
}
