"use client";

import DotGrid from "@/components/DotGrid";

export default function LandingBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <DotGrid
        className="absolute inset-0 opacity-46"
        dotSize={3}
        gap={22}
        baseColor="#6d28d9"
        activeColor="#8b5cf6"
        proximity={130}
        speedTrigger={90}
        shockRadius={220}
        style={{}}
      />
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(110% 68% at 50% 0%, transparent 0%, var(--landing-bg-tint) 100%)",
            "linear-gradient(to bottom, transparent 0%, transparent 62%, color-mix(in srgb, var(--page-bg) 38%, transparent) 75%, color-mix(in srgb, var(--page-bg) 72%, transparent) 88%, var(--page-bg) 100%)",
          ].join(","),
        }}
      />
    </div>
  );
}
