import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type TextareaProps = Readonly<TextareaHTMLAttributes<HTMLTextAreaElement>>;

export default function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}
