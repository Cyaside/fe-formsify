"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "formsify-theme";

type ThemeMode = "dark" | "light";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.classList.toggle("light", mode === "light");
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial = stored === "light" ? "light" : "dark";
    setMode(initial);
    applyTheme(initial);
  }, []);

  const handleToggle = () => {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="group inline-flex h-10 items-center gap-2 rounded-full border border-border/70 bg-surface/70 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink transition hover:border-lavender hover:text-lavender"
      aria-label="Toggle light or dark mode"
    >
      <span className="relative inline-flex h-4 w-8 items-center rounded-full bg-page">
        <span
          className={`absolute left-1 top-1 h-2 w-2 rounded-full transition-all duration-300 ${
            mode === "dark" ? "translate-x-0 bg-lavender" : "translate-x-4 bg-sun"
          }`}
        />
      </span>
      <span className="hidden text-[10px] font-semibold uppercase tracking-[0.32em] sm:inline">
        {mode === "dark" ? "Dark" : "Light"}
      </span>
    </button>
  );
}
