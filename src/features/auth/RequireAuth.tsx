"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [loading, pathname, router, user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-page text-ink flex items-center justify-center">
        <div className="rounded-3xl border border-white/10 bg-surface/70 px-8 py-6 text-sm text-ink-muted">
          Menyiapkan sesi...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
