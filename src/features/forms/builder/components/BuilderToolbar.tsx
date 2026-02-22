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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="gap-2"
              onClick={onAddSection}
              disabled={questionsLocked}
            >
              <Plus size={16} />
              Add Section
            </Button>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => {
                if (questionsLocked) return;
                setAddMenuOpen((prev) => !prev);
              }}
              disabled={questionsLocked}
            >
              <Plus size={16} />
              Add Question
            </Button>
          </div>

          {addMenuOpen ? (
            <div className="absolute left-0 top-12 z-30 w-52 rounded-xl border border-border bg-surface p-2">
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

        <div className="flex items-center gap-4">
          {formId ? (
            <Link href={`/forms/${formId}/view?returnTo=builder`}>
              <Button variant="secondary" className="gap-2">
                <Eye size={16} />
                Preview
              </Button>
            </Link>
          ) : (
            <Button variant="secondary" className="gap-2" disabled>
              <Eye size={16} />
              Preview
            </Button>
          )}

          <div className="text-center">
            <p className="text-sm font-semibold">Formsify Builder</p>
            <p className="text-xs text-ink-muted">{saveMessage}</p>
          </div>

          <Button
            className="gap-2"
            onClick={onPublish}
            disabled={publishing || questionsCount === 0}
            title={questionsCount === 0 ? publishNoQuestionMessage : undefined}
          >
            <Send size={16} />
            {publishing ? "Publishing..." : "Publish"}
          </Button>

          <Button
            variant="secondary"
            className="gap-2"
            onClick={onSaveDraft}
            disabled={savingDraft}
          >
            {savingDraft ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {savingDraft ? "Saving..." : "Save Draft"}
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
