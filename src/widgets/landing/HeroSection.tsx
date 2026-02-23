"use client";

import { useEffect, useState } from "react";
import Container from "@/shared/ui/Container";
import Navbar from "@/widgets/landing/Navbar";
import Link from "next/link";
import { useAuth } from "@/features/auth/AuthProvider";

export default function HeroSection() {
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    let raf = 0;
    const handleScroll = () => {
      if (raf) return;
      raf = globalThis.requestAnimationFrame(() => {
        const hero = document.getElementById("top");
        if (!hero) return;
        const rect = hero.getBoundingClientRect();
        const height = rect.height || 1;
        const scrolled = Math.min(Math.max(-rect.top / height, 0), 1);
        setProgress(scrolled);
        raf = 0;
      });
    };

    handleScroll();
    globalThis.addEventListener("scroll", handleScroll, { passive: true });
    globalThis.addEventListener("resize", handleScroll);
    return () => {
      globalThis.removeEventListener("scroll", handleScroll);
      globalThis.removeEventListener("resize", handleScroll);
      if (raf) globalThis.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="relative overflow-hidden border-b border-border bg-page" id="top">
      <Navbar />
      <Container className="relative pb-28 pt-32 md:pt-36">
        <div
          className="relative mx-auto flex h-105 w-full max-w-5xl items-center justify-center transition-[opacity,transform] duration-300"
          style={{
            transform: `translateY(${progress * 48}px) scale(${1 - progress * 0.03})`,
            opacity: 1 - progress * 0.6,
          }}
        >
          <div className="relative z-10 w-full rounded-3xl border border-border bg-surface px-4 py-10 text-center shadow-soft md:px-8 md:py-14">
            <h1 className="mx-auto max-w-300 text-[56px] leading-[0.95] font-extrabold tracking-tight text-ink md:text-[96px]">
              Create forms in the simplest way
            </h1>
            <p className="mt-6 mx-auto max-w-2xl text-lg text-ink-muted">
              Build, publish, and manage forms in one place with a clean workflow for questions,
              sections, and responses.
            </p>

            <div className="mt-8 flex items-center justify-center gap-3">
              {user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                  >
                    Login
                  </Link>

                  <Link
                    href="/register"
                    className="inline-flex items-center rounded-full border border-border bg-page px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                  >
                    Register
                  </Link>
                </>
              )}

              <Link
                href="/form-list"
                className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-accent focus:outline-none"
              >
                Form List
              </Link>
            </div>

            <p className="mt-3 text-sm text-ink-muted">
              {user ? "You are logged in." : "Login to create and manage your forms."}
            </p>
          </div>
        </div>
      </Container>
      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <svg
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
          className="h-32 w-full md:h-40"
          aria-hidden="true"
        >
          <path
            d="M0 140L120 120C240 100 480 60 720 80C960 100 1200 180 1320 190L1440 200V220H0Z"
            fill="var(--page-bg)"
          />
        </svg>
      </div>
    </section>
  );
}
