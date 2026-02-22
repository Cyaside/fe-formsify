import type { ReactNode } from "react";

type NavbarProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
};

export default function Navbar({
  eyebrow,
  title,
  description,
  align = "left",
  className = "",
}: NavbarProps) {
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <nav
      role="navigation"
      aria-label={eyebrow ?? title}
      className={`flex flex-col gap-3 ${alignment} ${className}`.trim()}
    >
      {eyebrow ? (
        <span className="text-xs font-semibold uppercase tracking-[0.32em] text-accent/80">{eyebrow}</span>
      ) : null}

      <h1 className="text-balance text-3xl font-semibold text-ink md:text-4xl font-display">{title}</h1>

      {description ? (
        <p className="max-w-2xl text-pretty text-base leading-7 text-ink-muted">{description}</p>
      ) : null}
    </nav>
  );
}
