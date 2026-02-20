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
import type { EditorQuestion, QuestionType } from "@/store/formEditor";
import { QUESTION_TYPE_OPTIONS, requiresOptions } from "./constants";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

type QuestionCardProps = {
  index: number;
  question: EditorQuestion;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
  onUpdate: (id: string, value: Partial<EditorQuestion>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onAddOption: (id: string) => void;
  onUpdateOption: (id: string, index: number, label: string) => void;
  onRemoveOption: (id: string, index: number) => void;
  onMoveOption: (id: string, fromIndex: number, toIndex: number) => void;
};

export default function QuestionCard({
  index,
  question,
  dragAttributes,
  dragListeners,
  onUpdate,
  onDuplicate,
  onDelete,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onMoveOption,
}: QuestionCardProps) {
  const optionsRequired = requiresOptions(question.type);

  const ensureType = (nextType: QuestionType) => {
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

  return (
    <Card className="space-y-4 p-4 md:p-5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-1 rounded-lg p-1 text-ink-muted hover:bg-surface-2"
          {...dragAttributes}
          {...dragListeners}
          aria-label="Drag question"
        >
          <GripVertical size={18} />
        </button>
        <div className="w-full space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start">
            <Input
              value={question.title}
              onChange={(event) =>
                onUpdate(question.id, {
                  title: event.target.value,
                })
              }
              placeholder={`Question ${index + 1}`}
              className="md:flex-1"
            />
            <Select
              value={question.type}
              onChange={(event) => ensureType(event.target.value as QuestionType)}
              className="md:w-[220px]"
            >
              {QUESTION_TYPE_OPTIONS.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            value={question.description}
            onChange={(event) =>
              onUpdate(question.id, {
                description: event.target.value,
              })
            }
            placeholder="Question description (optional)"
            className="min-h-[78px]"
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
                    placeholder={`Option ${optionIndex + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMoveOption(question.id, optionIndex, optionIndex - 1)}
                    disabled={optionIndex === 0}
                    aria-label="Move option up"
                  >
                    <ChevronUp size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMoveOption(question.id, optionIndex, optionIndex + 1)}
                    disabled={optionIndex === question.options.length - 1}
                    aria-label="Move option down"
                  >
                    <ChevronDown size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveOption(question.id, optionIndex)}
                    disabled={question.options.length <= 1}
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
              >
                <Plus size={14} />
                Add option
              </Button>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <label className="inline-flex items-center gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(event) => onUpdate(question.id, { required: event.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              Required
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => onDuplicate(question.id)}
              >
                <Copy size={14} />
                Duplicate
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="gap-1.5"
                onClick={() => onDelete(question.id)}
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
