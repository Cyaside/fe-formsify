import { useState } from "react";
import { Plus } from "lucide-react";
import type { QuestionType } from "@/features/forms/store/formEditor";
import { QUESTION_TYPE_OPTIONS } from "./constants";
import Button from "@/shared/ui/Button";

type FloatingAddQuestionProps = {
  onAdd: (type: QuestionType) => void;
};

export default function FloatingAddQuestion({ onAdd }: FloatingAddQuestionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-30">
      {open ? (
        <div className="mb-2 w-52 rounded-xl border border-border bg-surface p-2 shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
          {QUESTION_TYPE_OPTIONS.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => {
                onAdd(type.value);
                setOpen(false);
              }}
              className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-ink-muted transition hover:bg-surface-2 hover:text-ink"
            >
              {type.label}
            </button>
          ))}
        </div>
      ) : null}
      <Button
        className="h-12 w-12 rounded-full p-0"
        aria-label="Add question"
        onClick={() => setOpen((value) => !value)}
      >
        <Plus size={18} />
      </Button>
    </div>
  );
}
