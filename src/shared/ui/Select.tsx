import type { SelectHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const selectStyles = cva(
  "h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-ink transition-colors focus-visible:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-page invalid:border-danger/50 invalid:ring-danger/20 aria-[invalid=true]:border-danger/50 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-danger/20",
  {
    variants: {
      variant: {
        default: "",
        ghost: "border-transparent bg-surface-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type SelectProps = Readonly<SelectHTMLAttributes<HTMLSelectElement>> &
  VariantProps<typeof selectStyles>;

export default function Select({ className, children, variant, ...props }: SelectProps) {
  return (
    <select className={cn(selectStyles({ variant }), className)} {...props}>
      {children}
    </select>
  );
}
