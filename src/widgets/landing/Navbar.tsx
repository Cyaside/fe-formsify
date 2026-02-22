"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import ThemeToggle from "@/shared/theme/ThemeToggle";
import Container from "@/shared/ui/Container";
import Link from "next/link";
import { useAuth } from "@/features/auth/AuthProvider";

const NAV_ITEMS = [
  { id: "top", label: "Home" },
  { id: "about", label: "About" },
  { id: "steps", label: "Steps" },
  { id: "testimonials", label: "Reviews" },
  { id: "contact", label: "Contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
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
    setIsOpen(false);
  };

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

      <div className="fixed top-5 right-6 z-50 flex items-center gap-3 md:hidden">
        <ThemeToggle />
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setIsOpen((prev) => !prev)}
          className="rounded-full border border-border bg-surface p-3 shadow-soft"
          aria-label="Toggle navigation"
        >
          <div className="relative h-6 w-6">
            <motion.span
              animate={{ rotate: isOpen ? 45 : 0, y: isOpen ? 8 : 0 }}
              className="absolute left-0 top-0 h-0.5 w-6 rounded-full bg-ink"
            />
            <motion.span
              animate={{ opacity: isOpen ? 0 : 1 }}
              className="absolute left-0 top-2.5 h-0.5 w-6 rounded-full bg-ink"
            />
            <motion.span
              animate={{ rotate: isOpen ? -45 : 0, y: isOpen ? -8 : 0 }}
              className="absolute left-0 top-5 h-0.5 w-6 rounded-full bg-ink"
            />
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-page/95"
            onClick={() => setIsOpen(false)}
          >
            <Container className="flex h-full flex-col items-center justify-center gap-8">
              {NAV_ITEMS.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: index * 0.08 }}
                  onClick={() => handleScrollToSection(item.id)}
                  className={`text-2xl font-semibold transition ${
                    activeSection === item.id
                      ? "text-accent"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </motion.button>
              ))}
              {user ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: NAV_ITEMS.length * 0.08 }}
                >
                  <Link
                    href="/dashboard"
                    className="rounded-full border border-accent/30 px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-accent"
                  >
                    Dashboard
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: NAV_ITEMS.length * 0.08 }}
                  className="flex flex-col gap-3"
                >
                  <Link
                    href="/login"
                    className="rounded-full border border-border px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-ink-muted"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full border border-accent/30 px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-accent"
                  >
                    Register
                  </Link>
                </motion.div>
              )}
            </Container>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
