import { useState } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import {
  Copy,
  GripVertical,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type {
  EditorQuestion,
  EditorSection,
  QuestionType,
} from "@/features/forms/store/formEditor";
import { QUESTION_TYPE_OPTIONS, requiresOptions } from "../lib/constants";
import Card from "@/shared/ui/Card";
import Input from "@/shared/ui/Input";
import Textarea from "@/shared/ui/Textarea";
import Select from "@/shared/ui/Select";
import Button from "@/shared/ui/Button";

const SHORT_ANSWER_MAX_CHAR = 100;
const PARAGRAPH_MAX_CHAR = 1000;

type QuestionCardProps = {
  index: number;
  question: EditorQuestion;
  sections: EditorSection[];
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
  onUpdate: (id: string, value: Partial<EditorQuestion>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onAddOption: (id: string) => void;
  onUpdateOption: (id: string, index: number, label: string) => void;
  onRemoveOption: (id: string, index: number) => void;
  onMoveOption: (id: string, fromIndex: number, toIndex: number) => void;
  onFieldFocus?: (target: {
    kind: "question" | "option";
    id?: string;
    field?: string;
  }) => void;
  onFieldBlur?: () => void;
  getEditorsLabel?: (target: {
    kind: "question" | "option";
    id?: string;
    field?: string;
  }) => string | null;
  readOnly?: boolean;
};

function PresenceBadge({ label }: Readonly<{ label: string | null | undefined }>) {
  if (!label) return null;
  return <p className="text-xs font-medium text-sky-700">Being edited by: {label}</p>;
}

export default function QuestionCard({
  index,
  question,
  sections,
  dragAttributes,
  dragListeners,
  onUpdate,
  onDuplicate,
  onDelete,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onMoveOption,
  onFieldFocus,
  onFieldBlur,
  getEditorsLabel,
  readOnly = false,
}: QuestionCardProps) {
  const optionsRequired = requiresOptions(question.type);
  const isTextAnswerType = question.type === "SHORT_ANSWER" || question.type === "PARAGRAPH";
  const [bulkPasteOpen, setBulkPasteOpen] = useState(false);
  const [bulkPasteValue, setBulkPasteValue] = useState("");

  const ensureType = (nextType: QuestionType) => {
    if (readOnly) return;
    const shouldKeep = requiresOptions(nextType);
    onUpdate(question.id, {
      type: nextType,
      options: shouldKeep
        ? question.options.length > 0
          ? question.options
          : ["Option 1"]
        : [],
    });
  };

  const applyBulkPasteOptions = () => {
    if (readOnly) return;
    const parsed = bulkPasteValue
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (parsed.length === 0) return;
    onUpdate(question.id, { options: parsed });
    setBulkPasteOpen(false);
    setBulkPasteValue("");
  };

  return (
    <Card className="space-y-4 p-4 md:p-5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-1 rounded-lg p-1 text-ink-muted hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
          {...(readOnly ? {} : dragAttributes)}
          {...(readOnly ? {} : dragListeners)}
          disabled={readOnly}
          aria-label="Drag question"
        >
          <GripVertical size={18} />
        </button>
        <div className="w-full space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start">
            <div className="md:flex-1">
              <Input
                value={question.title}
                onChange={(event) =>
                  onUpdate(question.id, {
                    title: event.target.value,
                  })
                }
                onFocus={() =>
                  onFieldFocus?.({ kind: "question", id: question.id, field: "title" })
                }
                onBlur={onFieldBlur}
                placeholder={`Question ${index + 1}`}
                className="md:flex-1"
                disabled={readOnly}
              />
              <PresenceBadge
                label={getEditorsLabel?.({ kind: "question", id: question.id, field: "title" })}
              />
            </div>
            <Select
              value={question.type}
              onChange={(event) => ensureType(event.target.value as QuestionType)}
              className="md:w-[220px]"
              disabled={readOnly}
            >
              {QUESTION_TYPE_OPTIONS.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>
          {isTextAnswerType ? (
            <p className="text-xs text-ink-muted">
              {question.type === "PARAGRAPH"
                ? `Paragraph answer (multi-line), max ${PARAGRAPH_MAX_CHAR.toLocaleString()} characters.`
                : `Short answer (single-line), max ${SHORT_ANSWER_MAX_CHAR.toLocaleString()} characters.`}
            </p>
          ) : null}
          <Select
            value={question.sectionId}
            onChange={(event) =>
              onUpdate(question.id, {
                sectionId: event.target.value,
              })
            }
            className="md:w-[260px]"
            disabled={readOnly || sections.length === 0}
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title || "Untitled section"}
              </option>
            ))}
          </Select>

          <Textarea
            value={question.description}
            onChange={(event) =>
              onUpdate(question.id, {
                description: event.target.value,
              })
            }
            onFocus={() =>
              onFieldFocus?.({ kind: "question", id: question.id, field: "description" })
            }
            onBlur={onFieldBlur}
            placeholder="Question description (optional)"
            className="min-h-[78px]"
            disabled={readOnly}
          />
          <PresenceBadge
            label={getEditorsLabel?.({ kind: "question", id: question.id, field: "description" })}
          />

          {optionsRequired ? (
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <div key={`${question.id}-${optionIndex}`} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(event) =>
                      onUpdateOption(question.id, optionIndex, event.target.value)
                    }
                    onFocus={() =>
                      onFieldFocus?.({
                        kind: "option",
                        id: `${question.id}:${optionIndex}`,
                        field: "label",
                      })
                    }
                    onBlur={onFieldBlur}
                    placeholder={`Option ${optionIndex + 1}`}
                    disabled={readOnly}
                  />
                  <div className="min-w-0 max-w-[14rem]">
                    <PresenceBadge
                      label={getEditorsLabel?.({
                        kind: "option",
                        id: `${question.id}:${optionIndex}`,
                        field: "label",
                      })}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMoveOption(question.id, optionIndex, optionIndex - 1)}
                    disabled={readOnly || optionIndex === 0}
                    aria-label="Move option up"
                  >
                    <ChevronUp size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMoveOption(question.id, optionIndex, optionIndex + 1)}
                    disabled={readOnly || optionIndex === question.options.length - 1}
                    aria-label="Move option down"
                  >
                    <ChevronDown size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveOption(question.id, optionIndex)}
                    disabled={readOnly || question.options.length <= 1}
                    aria-label="Delete option"
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => onAddOption(question.id)}
                disabled={readOnly}
              >
                <Plus size={14} />
                Add option
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (readOnly) return;
                  setBulkPasteOpen((prev) => !prev);
                  if (!bulkPasteOpen) {
                    setBulkPasteValue(question.options.join("\n"));
                  }
                }}
                disabled={readOnly}
              >
                {bulkPasteOpen ? "Close bulk paste" : "Bulk paste"}
              </Button>

              {bulkPasteOpen ? (
                <div className="space-y-2 rounded-xl border border-border bg-surface-2 p-3">
                  <p className="text-xs text-ink-muted">
                    One option per line. Empty lines will be ignored.
                  </p>
                  <Textarea
                    value={bulkPasteValue}
                    onChange={(event) => setBulkPasteValue(event.target.value)}
                    onFocus={() =>
                      onFieldFocus?.({ kind: "question", id: question.id, field: "options-bulk" })
                    }
                    onBlur={onFieldBlur}
                    className="min-h-[110px]"
                    placeholder={"Option 1\nOption 2\nOption 3"}
                    disabled={readOnly}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setBulkPasteOpen(false);
                        setBulkPasteValue("");
                      }}
                      disabled={readOnly}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={applyBulkPasteOptions}
                      disabled={readOnly}
                    >
                      Replace options
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <label className="inline-flex items-center gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(event) => onUpdate(question.id, { required: event.target.checked })}
                className="h-4 w-4 rounded border-border accent-accent"
                disabled={readOnly}
              />
              Required
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => onDuplicate(question.id)}
                disabled={readOnly}
              >
                <Copy size={14} />
                Duplicate
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="gap-1.5"
                onClick={() => onDelete(question.id)}
                disabled={readOnly}
              >
                <Trash2 size={14} />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
