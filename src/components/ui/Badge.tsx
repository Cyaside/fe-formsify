import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "draft" | "published" | "muted";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClass: Record<BadgeVariant, string> = {
  draft: "border border-sun/40 bg-sun/10 text-sun",
  published: "border border-lavender/40 bg-lavender/10 text-lavender",
  muted: "border border-border bg-surface-2 text-ink-muted",
};

export default function Badge({ className, variant = "muted", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]",
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}
