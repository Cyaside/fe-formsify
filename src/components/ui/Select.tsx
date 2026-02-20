import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type SelectProps = Readonly<SelectHTMLAttributes<HTMLSelectElement>>;

export default function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-ink focus:border-lavender focus:outline-none",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
