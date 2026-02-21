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
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (globalThis.window === undefined) return "dark";
    const stored = globalThis.localStorage.getItem(STORAGE_KEY);
    return stored === "light" ? "light" : "dark";
  });

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  const handleToggle = () => {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    globalThis.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-surface/80 text-ink transition hover:border-lavender hover:text-lavender focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender/40 focus-visible:ring-offset-2 focus-visible:ring-offset-page"
      aria-label="Toggle light or dark mode"
      aria-pressed={mode === "dark"}
      title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {mode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
