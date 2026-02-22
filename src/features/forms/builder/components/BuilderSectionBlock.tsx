"use client";

import { Copy, GripVertical } from "lucide-react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type {
  EditorQuestion,
  EditorSection,
} from "@/features/forms/store/formEditor";
import Button from "@/shared/ui/Button";
import Card from "@/shared/ui/Card";
import Input from "@/shared/ui/Input";
import Textarea from "@/shared/ui/Textarea";
import { SortableQuestionItem, SortableSectionContainer } from "./BuilderSortableItems";
import { toQuestionSortableId } from "../lib/formBuilderShared";

type BuilderSectionBlockProps = Readonly<{
  section: EditorSection;
  sectionIndex: number;
  totalSections: number;
  sectionQuestions: EditorQuestion[];
  orderedSections: EditorSection[];
  questionsLocked: boolean;
  onUpdateSection: (id: string, value: Partial<EditorSection>) => void;
  onMoveSection: (id: string, direction: -1 | 1) => void;
  onDuplicateSection: (id: string) => void;
  onRemoveSection: (id: string) => void;
  onAddQuestionToSection: (sectionId: string) => void;
  onQuestionUpdate: (id: string, value: Partial<EditorQuestion>) => void;
  onDuplicateQuestion: (id: string) => void;
  onRemoveQuestion: (id: string) => void;
  onAddOption: (id: string) => void;
  onUpdateOption: (id: string, optionIndex: number, label: string) => void;
  onRemoveOption: (id: string, optionIndex: number) => void;
  onMoveOption: (id: string, fromIndex: number, toIndex: number) => void;
}>;

function SectionHeaderCard({
  section,
  sectionIndex,
  totalSections,
  canDeleteSection,
  questionsLocked,
  onUpdateSection,
  onMoveSection,
  onDuplicateSection,
  onRemoveSection,
  onAddQuestionToSection,
  dragAttributes,
  dragListeners,
}: Readonly<{
  section: EditorSection;
  sectionIndex: number;
  totalSections: number;
  canDeleteSection: boolean;
  questionsLocked: boolean;
  onUpdateSection: (id: string, value: Partial<EditorSection>) => void;
  onMoveSection: (id: string, direction: -1 | 1) => void;
  onDuplicateSection: (id: string) => void;
  onRemoveSection: (id: string) => void;
  onAddQuestionToSection: (sectionId: string) => void;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
}>) {
  return (
    <Card className="border-t-4 border-t-accent/70 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <button
            type="button"
            className="mt-1 rounded-lg p-1 text-ink-muted hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
            {...(dragAttributes ?? {})}
            {...(dragListeners ?? {})}
            disabled={questionsLocked}
            aria-label="Drag section"
          >
            <GripVertical size={18} />
          </button>
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              value={section.title}
              onChange={(event) =>
                onUpdateSection(section.id, { title: event.target.value })
              }
              placeholder={`Section ${sectionIndex + 1}`}
              disabled={questionsLocked}
            />
            <Textarea
              value={section.description}
              onChange={(event) =>
                onUpdateSection(section.id, { description: event.target.value })
              }
              placeholder="Section description (optional)"
              className="min-h-[68px]"
              disabled={questionsLocked}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveSection(section.id, -1)}
            disabled={questionsLocked || sectionIndex === 0}
          >
            Move up
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveSection(section.id, 1)}
            disabled={questionsLocked || sectionIndex === totalSections - 1}
          >
            Move down
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => onDuplicateSection(section.id)}
            disabled={questionsLocked}
          >
            <Copy size={14} />
            Duplicate section
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onAddQuestionToSection(section.id)}
            disabled={questionsLocked}
          >
            Add question
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onRemoveSection(section.id)}
            disabled={!canDeleteSection}
          >
            Delete section
          </Button>
        </div>
      </div>

      <p className="mt-2 text-xs text-ink-muted">
        Section {sectionIndex + 1} of {totalSections}
      </p>
    </Card>
  );
}

export default function BuilderSectionBlock({
  section,
  sectionIndex,
  totalSections,
  sectionQuestions,
  orderedSections,
  questionsLocked,
  onUpdateSection,
  onMoveSection,
  onDuplicateSection,
  onRemoveSection,
  onAddQuestionToSection,
  onQuestionUpdate,
  onDuplicateQuestion,
  onRemoveQuestion,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onMoveOption,
}: BuilderSectionBlockProps) {
  const canDeleteSection =
    !questionsLocked &&
    totalSections > 1 &&
    sectionQuestions.length === 0;

  return (
    <SortableSectionContainer sectionId={section.id} readOnly={questionsLocked}>
      {({ dragAttributes, dragListeners }) => (
        <div className="space-y-3">
          <SectionHeaderCard
            section={section}
            sectionIndex={sectionIndex}
            totalSections={totalSections}
            canDeleteSection={canDeleteSection}
            questionsLocked={questionsLocked}
            onUpdateSection={onUpdateSection}
            onMoveSection={onMoveSection}
            onDuplicateSection={onDuplicateSection}
            onRemoveSection={onRemoveSection}
            onAddQuestionToSection={onAddQuestionToSection}
            dragAttributes={dragAttributes}
            dragListeners={dragListeners}
          />

          {sectionQuestions.length === 0 ? (
            <Card className="text-sm text-ink-muted">
              No questions in this section yet.
            </Card>
          ) : (
            <SortableContext
              items={sectionQuestions.map((question) => toQuestionSortableId(question.id))}
              strategy={verticalListSortingStrategy}
            >
              {sectionQuestions.map((question, index) => (
                <SortableQuestionItem
                  key={question.id}
                  index={index}
                  question={question}
                  sections={orderedSections}
                  onUpdate={onQuestionUpdate}
                  onDuplicate={onDuplicateQuestion}
                  onDelete={onRemoveQuestion}
                  onAddOption={onAddOption}
                  onUpdateOption={onUpdateOption}
                  onRemoveOption={onRemoveOption}
                  onMoveOption={onMoveOption}
                  readOnly={questionsLocked}
                />
              ))}
            </SortableContext>
          )}
        </div>
      )}
    </SortableSectionContainer>
  );
}
