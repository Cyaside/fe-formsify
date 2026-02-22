"use client";

import { useEffect } from "react";

type Options = {
  enabled: boolean;
  confirmMessage?: string;
};

const DEFAULT_MESSAGE =
  "Perubahan belum tersimpan sepenuhnya. Yakin ingin meninggalkan halaman builder?";

export function useUnsavedChangesNavigationGuard({
  enabled,
  confirmMessage = DEFAULT_MESSAGE,
}: Options) {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const handleAnchorNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const currentUrl = new URL(globalThis.location.href);
      const nextUrl = new URL(anchor.href, currentUrl.href);
      if (nextUrl.origin !== currentUrl.origin) return;

      const sameLocation =
        currentUrl.pathname === nextUrl.pathname &&
        currentUrl.search === nextUrl.search &&
        currentUrl.hash === nextUrl.hash;
      if (sameLocation) return;

      const confirmed = globalThis.confirm(confirmMessage);
      if (!confirmed) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    globalThis.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleAnchorNavigation, true);
    return () => {
      globalThis.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleAnchorNavigation, true);
    };
  }, [confirmMessage, enabled]);
}
