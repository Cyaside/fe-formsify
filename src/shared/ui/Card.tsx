import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const cardStyles = cva("rounded-2xl border border-border bg-surface p-5 shadow-soft", {
  variants: {
    variant: {
      default: "",
      subtle: "bg-surface-2",
      ghost: "border-transparent bg-transparent shadow-none",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type CardProps = Readonly<HTMLAttributes<HTMLDivElement>> &
  VariantProps<typeof cardStyles>;

export default function Card({ className, variant, ...props }: CardProps) {
  return <div className={cn(cardStyles({ variant }), className)} {...props} />;
}
