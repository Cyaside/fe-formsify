import type { TextareaHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const textareaStyles = cva(
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted transition focus-visible:border-lavender focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender/35 focus-visible:ring-offset-2 focus-visible:ring-offset-page",
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

type TextareaProps = Readonly<TextareaHTMLAttributes<HTMLTextAreaElement>> &
  VariantProps<typeof textareaStyles>;

export default function Textarea({ className, variant, ...props }: TextareaProps) {
  return (
    <textarea className={cn(textareaStyles({ variant }), className)} {...props} />
  );
}
