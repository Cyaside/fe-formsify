"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import BlurText from "@/widgets/landing/components/reactbits/BlurText";
import TextType from "@/widgets/landing/components/reactbits/TextType";
import Container from "@/shared/ui/Container";
import Navbar from "@/widgets/landing/Navbar";
import Link from "next/link";
import { useAuth } from "@/features/auth/AuthProvider";

export default function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const { user, loading } = useAuth();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 52]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.97]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.42]);

  const welcomeText = user
    ? `Welcome back, ${user.name?.trim() || user.email}!`
    : loading
      ? "Checking your session..."
      : "Login to create and manage your forms.";

  return (
    <section ref={heroRef} className="relative overflow-hidden" id="top">
      <Navbar />
      <Container className="relative pb-28 pt-32 md:pt-36">
        <motion.div
          className="relative mx-auto flex h-105 w-full max-w-5xl items-center justify-center transition-[opacity,transform] duration-300"
          style={{ y, scale, opacity }}
        >
          <div className="relative z-10 w-full px-4 py-10 text-center md:px-8 md:py-14">
            <h1 className="mx-auto flex max-w-300 flex-wrap items-center justify-center gap-x-4 text-[56px] leading-[0.95] font-extrabold tracking-tight md:text-[96px]">
              <BlurText
                as="span"
                text="Create"
                delay={120}
                animateBy="words"
                direction="top"
                className="justify-center text-ink"
              />
              <BlurText
                as="span"
                text="forms"
                delay={140}
                animateBy="words"
                direction="top"
                className="justify-center text-accent"
              />
              <BlurText
                as="span"
                text="in"
                delay={160}
                animateBy="words"
                direction="top"
                className="justify-center text-ink"
              />
              <BlurText
                as="span"
                text="the"
                delay={180}
                animateBy="words"
                direction="top"
                className="justify-center text-ink"
              />
              <BlurText
                as="span"
                text="simplest"
                delay={200}
                animateBy="words"
                direction="top"
                className="justify-center text-ink"
              />
              <BlurText
                as="span"
                text="way"
                delay={220}
                animateBy="words"
                direction="top"
                className="justify-center text-ink"
              />
            </h1>
            <TextType
              as="p"
              text="Build, publish, and manage forms in one place with a clean workflow for questions, sections, and responses."
              className="mx-auto mt-6 block max-w-2xl text-lg text-ink-muted"
              typingSpeed={18}
              deletingSpeed={8}
              pauseDuration={1200}
              loop={false}
              showCursor={false}
              startOnVisible={true}
            />

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

            <TextType
              as="p"
              text={welcomeText}
              className="mt-3 block text-sm text-ink-muted"
              typingSpeed={24}
              deletingSpeed={8}
              pauseDuration={1200}
              loop={false}
              showCursor={false}
              startOnVisible={true}
            />
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
