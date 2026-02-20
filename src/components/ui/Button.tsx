import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-lavender text-violet-deep hover:bg-sun disabled:bg-lavender/70 disabled:text-violet-deep/80",
  secondary:
    "border border-border bg-surface text-ink hover:bg-surface-2 disabled:opacity-70",
  ghost: "text-ink-muted hover:bg-surface-2 hover:text-ink disabled:opacity-70",
  danger:
    "border border-rose/40 bg-rose/10 text-rose hover:bg-rose/20 disabled:opacity-70",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export default function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition disabled:cursor-not-allowed",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  );
}
