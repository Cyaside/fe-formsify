import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type InputProps = Readonly<InputHTMLAttributes<HTMLInputElement>>;

export default function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}
