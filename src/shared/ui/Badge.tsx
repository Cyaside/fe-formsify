import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const badgeStyles = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]",
  {
    variants: {
      variant: {
        draft: "border border-sun/40 bg-sun/10 text-sun",
        published: "border border-lavender/40 bg-lavender/10 text-lavender",
        muted: "border border-border bg-surface-2 text-ink-muted",
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
