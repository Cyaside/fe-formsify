"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

function SectionWrapper({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [mountedInSection, setMountedInSection] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Find closest section ancestor; if found, allow rendering. This enforces per-section usage.
    const section = el.closest("section");
    const raf = globalThis.requestAnimationFrame(() => {
      if (section) {
        setMountedInSection(true);
        return;
      }
      // If not used inside a section, don't render and warn for developer.
      console.warn(
        "Decoration mounted outside a <section>. Decorations are intended to be used per-section.",
      );
      setMountedInSection(false);
    });

    return () => globalThis.cancelAnimationFrame(raf);
  }, []);

  if (!mountedInSection) return <div ref={ref} />;

  return (
    <div ref={ref} className={className} style={style} aria-hidden>
      {children}
    </div>
  );
}

export function DecoLeft(
  { className, style }: { className?: string; style?: CSSProperties } = {},
) {
  const wrapperClass = className ?? "pointer-events-none absolute -left-4 -top-4 select-none";
  const wrapperStyle = style ?? { width: 280 };

  return (
    <SectionWrapper className={wrapperClass} style={wrapperStyle}>
      <svg viewBox="0 0 280 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="55" fill="#FF4D6D" />
        <circle cx="60" cy="60" r="30" fill="white" />
        <rect x="110" y="20" width="60" height="60" fill="#B8FF3C" transform="rotate(20 140 50)" />
        <path d="M20,140 C0,110 30,80 70,95 C110,110 130,150 100,175 C70,200 40,170 20,140Z" fill="#FF8C00" />
        <path d="M0,220 A70,70 0 0,1 140,220Z" fill="#00BFFF" />
        <rect x="140" y="80" width="100" height="18" rx="9" fill="#FF2D78" transform="rotate(-35 140 80)" />
        <circle cx="200" cy="40" r="22" fill="#00E5CC" />
        <circle cx="200" cy="40" r="10" fill="white" />
        <rect x="50" y="230" width="70" height="70" rx="28" fill="#7C3AED" />
        <rect x="130" y="258" width="100" height="14" rx="7" fill="#F5FF00" />
      </svg>
    </SectionWrapper>
  );
}

export function DecoRight(
  { className, style }: { className?: string; style?: CSSProperties } = {},
) {
  const wrapperClass = className ?? "pointer-events-none absolute -right-4 -top-4 select-none";
  const wrapperStyle = style ?? { width: 280 };

  return (
    <SectionWrapper className={wrapperClass} style={wrapperStyle}>
      <svg viewBox="0 0 280 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="240" cy="50" rx="90" ry="60" fill="#B8FF3C" />
        <path d="M140,10 A80,80 0 0,1 260,80 A50,50 0 0,0 140,10Z" fill="#FF4D6D" />
        <rect x="120" y="100" width="80" height="30" rx="6" fill="#00E5CC" transform="rotate(-15 160 115)" />
        <path d="M200,140 C240,120 270,160 255,200 C240,240 190,240 175,205 C160,170 160,160 200,140Z" fill="#FF8C00" />
        <circle cx="100" cy="205" r="50" fill="#00BFFF" />
        <circle cx="100" cy="205" r="25" fill="white" />
        <path d="M60,260 L90,245 L120,260 L150,245 L180,260 L180,275 L150,260 L120,275 L90,260 L60,275Z" fill="#7C3AED" />
        <rect x="228" y="245" width="42" height="42" rx="8" fill="#F5FF00" />
        <rect x="50" y="130" width="90" height="14" rx="7" fill="#FF2D78" transform="rotate(30 95 137)" />
      </svg>
    </SectionWrapper>
  );
}

