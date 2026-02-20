import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ModalProps = Readonly<{
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  onClose: () => void;
}>;

export default function Modal({
  open,
  title,
  description,
  children,
  onClose,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-ink">{title}</h3>
            {description ? (
              <p className={cn("mt-1 text-sm text-ink-muted")}>{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-ink-muted transition hover:bg-surface-2 hover:text-ink"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </div>
  );
}
