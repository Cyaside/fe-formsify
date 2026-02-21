import { useId, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

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
  const titleId = useId();
  const descriptionId = useId();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-pop"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id={titleId} className="text-base font-semibold text-ink">
              {title}
            </h3>
            {description ? (
              <p id={descriptionId} className={cn("mt-1 text-sm text-ink-muted")}>
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-ink-muted transition hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            aria-label="Close modal"
          >
            x
          </button>
        </div>
        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </div>
  );
}
