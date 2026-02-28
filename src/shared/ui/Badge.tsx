import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const badgeStyles = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]",
  {
    variants: {
      variant: {
        draft: "border border-sun/25 bg-sun/10 text-sun",
        published:
          "border border-accent/20 bg-accent-100 text-accent-900 dark:border-accent-700 dark:bg-accent-700 dark:text-white",
        closed:
          "border border-rose/25 bg-rose/10 text-rose dark:border-rose/40 dark:bg-rose/10 dark:text-rose",
        muted: "border border-border bg-surface-2 text-ink-muted",
        owned:
          "border border-accent/30 bg-accent/10 text-accent-900 dark:border-accent-400/45 dark:bg-accent-500/22 dark:text-accent-100",
        collab: "border border-sky-500/25 bg-sky-500/10 text-sky-700",
      },
    },
    defaultVariants: {
      variant: "muted",
    },
  },
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeStyles>;

export default function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeStyles({ variant }), className)} {...props} />;
}
