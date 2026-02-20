import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardProps = Readonly<HTMLAttributes<HTMLDivElement>>;

export default function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
        className,
      )}
      {...props}
    />
  );
}
