"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "formsify-theme";

type ThemeMode = "dark" | "light";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.classList.toggle("light", mode === "light");
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode | null>(null);
  const [mounted, setMounted] = useState(false);

  // Determine initial mode on mount to avoid SSR/CSR mismatch
  useEffect(() => {
    const stored = globalThis.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      setMode(stored as ThemeMode);
    } else if (globalThis.matchMedia?.("(prefers-color-scheme: light)").matches) {
      setMode("light");
    } else {
      setMode("dark");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mode) applyTheme(mode);
  }, [mode]);

  const handleToggle = () => {
    const current = mode ?? "dark";
    const next = current === "dark" ? "light" : "dark";
    setMode(next);
    try {
      globalThis.localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {
      // ignore storage errors
    }
    applyTheme(next);
  };

  // While we haven't mounted and determined the mode, render a neutral button
  // to avoid a server/client markup mismatch. After mount, render the real icon.
  return (
    <button
      type="button"
      onClick={handleToggle}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-surface/80 text-ink transition hover:border-lavender hover:text-lavender focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender/40 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
      aria-label="Toggle light or dark mode"
      aria-pressed={mode === "dark"}
      title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {mounted && mode ? (mode === "dark" ? <Sun size={18} /> : <Moon size={18} />) : null}
    </button>
  );
}
