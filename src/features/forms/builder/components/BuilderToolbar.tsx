"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Plus, Save, Send } from "lucide-react";
import type { QuestionType } from "@/features/forms/store/formEditor";
import Button from "@/shared/ui/Button";
import ThemeToggle from "@/shared/theme/ThemeToggle";
import { QUESTION_TYPE_OPTIONS } from "../lib/constants";

type BuilderToolbarProps = Readonly<{
  formId: string | null;
  questionsLocked: boolean;
  saveMessage: string;
  publishing: boolean;
  savingDraft: boolean;
  questionsCount: number;
  publishNoQuestionMessage: string;
  publishButtonLabel: string;
  showSaveDraftButton: boolean;
  onAddSection: () => void;
  onAddQuestionType: (type: QuestionType) => void;
  onPublish: () => void;
  onSaveDraft: () => void;
}>;

export default function BuilderToolbar({
  formId,
  questionsLocked,
  saveMessage,
  publishing,
  savingDraft,
  questionsCount,
  publishNoQuestionMessage,
  publishButtonLabel,
  showSaveDraftButton,
  onAddSection,
  onAddQuestionType,
  onPublish,
  onSaveDraft,
}: BuilderToolbarProps) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  useEffect(() => {
    if (questionsLocked) setAddMenuOpen(false);
  }, [questionsLocked]);

  return (
    <nav className="sticky top-3 z-20 mb-4 rounded-2xl border border-border bg-surface p-3 shadow-soft">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0">
            <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              className="min-w-0 gap-2"
              onClick={onAddSection}
              disabled={questionsLocked}
            >
              <Plus size={16} />
              <span className="truncate">Add Section</span>
            </Button>
            <Button
              variant="secondary"
              className="min-w-0 gap-2"
              onClick={() => {
                if (questionsLocked) return;
                setAddMenuOpen((prev) => !prev);
              }}
              disabled={questionsLocked}
            >
              <Plus size={16} />
              <span className="truncate">Add Question</span>
            </Button>
          </div>

          {addMenuOpen ? (
            <div className="absolute left-0 top-12 z-30 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-2 shadow-soft">
              {QUESTION_TYPE_OPTIONS.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    if (questionsLocked) return;
                    onAddQuestionType(type.value);
                    setAddMenuOpen(false);
                  }}
                  className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-ink-muted transition hover:bg-surface-2 hover:text-ink"
                >
                  {type.label}
                </button>
              ))}
            </div>
          ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {formId ? (
              <Link href={`/forms/${formId}/view?returnTo=builder`} className="contents">
                <Button variant="secondary" className="min-w-0 gap-2">
                  <Eye size={16} />
                  <span className="truncate">Preview</span>
                </Button>
              </Link>
            ) : (
              <Button variant="secondary" className="min-w-0 gap-2" disabled>
                <Eye size={16} />
                <span className="truncate">Preview</span>
              </Button>
            )}

            <Button
              className="min-w-0 gap-2"
              onClick={onPublish}
              disabled={publishing || questionsCount === 0 || savingDraft}
              title={questionsCount === 0 ? publishNoQuestionMessage : undefined}
            >
              <Send size={16} />
              <span className="truncate">
                {publishing ? `${publishButtonLabel}...` : publishButtonLabel}
              </span>
            </Button>

            {showSaveDraftButton ? (
            <Button
              variant="secondary"
              className="min-w-0 gap-2"
              onClick={onSaveDraft}
              disabled={savingDraft || publishing}
            >
              {savingDraft ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span className="truncate">{savingDraft ? "Saving..." : "Save Draft"}</span>
            </Button>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-surface-2 px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Formsify Builder</p>
            <p className="truncate text-xs text-ink-muted" title={saveMessage}>
              {saveMessage}
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
