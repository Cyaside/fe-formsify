"use client";

import { useEffect, useState } from "react";
import Container from "@/components/ui/Container";
import Navbar from "@/components/sections/landing/Navbar";

export default function HeroSection() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const handleScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
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
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-violet-deep via-violet/70 to-violet-deep"
      id="top"
    >
      <Navbar />
      <Container className="relative pb-28 pt-32 md:pt-36">
        <div
          className="relative mx-auto flex h-[420px] w-full max-w-5xl items-center justify-center transition-[opacity,transform] duration-300"
          style={{
            transform: `translateY(${progress * 48}px) scale(${1 - progress * 0.03})`,
            opacity: 1 - progress * 0.6,
          }}
        >
          <div className="absolute -left-12 top-12 h-64 w-64 rounded-full bg-violet/25 blur-2xl" />
          <div className="absolute -right-10 bottom-8 h-72 w-72 rounded-full bg-rose/20 blur-2xl" />
          <div className="absolute left-1/2 top-8 h-52 w-52 -translate-x-1/2 rounded-full bg-lavender/20 blur-3xl" />

          <div className="relative z-10 w-full text-center px-4">
            <h1 className="mx-auto max-w-[1200px] text-[56px] leading-[0.95] font-extrabold tracking-tight text-ink md:text-[96px]">
              The simplest way to create forms
            </h1>
            <p className="mt-6 mx-auto max-w-2xl text-lg text-ink-muted">
              Say goodbye to boring forms. Meet Tally — the free, intuitive form builder you’ve been
              looking for.
            </p>

            <div className="mt-8 flex items-center justify-center">
              <button
                type="button"
                className="inline-flex items-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Login
              </button>
            </div>

            <p className="mt-3 text-sm text-ink-muted">Login to create your forms</p>
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
