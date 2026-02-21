"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useGlobalLoading } from "@/shared/store/globalLoading";

export default function GlobalLoading() {
  const pendingCount = useGlobalLoading((state) => state.pendingCount);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: number | undefined;

    if (pendingCount > 0) {
      timer = window.setTimeout(() => setVisible(true), 150);
    } else {
      timer = window.setTimeout(() => setVisible(false), 0);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [pendingCount]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-page/80 backdrop-blur-sm">
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-6 py-5 text-center shadow-pop"
      >
        <Loader2 className="h-7 w-7 animate-spin text-lavender" />
        <p className="text-sm text-ink-muted">Loading...</p>
      </div>
    </div>
  );
}
