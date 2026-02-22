"use client";

import type { ComponentProps } from "react";
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { EditorQuestion, EditorSection } from "@/features/forms/store/formEditor";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import BuilderSectionBlock from "./BuilderSectionBlock";
import { toSectionSortableId } from "../lib/formBuilderShared";

type BuilderCanvasProps = Readonly<{
  loading: boolean;
  error: string | null;
  orderedSections: EditorSection[];
  questions: EditorQuestion[];
  questionsLocked: boolean;
  sensors: ComponentProps<typeof DndContext>["sensors"];
  onDragEnd: (event: DragEndEvent) => void;
  onAddSection: () => void;
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

export default function BuilderCanvas({
  loading,
  error,
  orderedSections,
  questions,
  questionsLocked,
  sensors,
  onDragEnd,
  onAddSection,
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
}: BuilderCanvasProps) {
  if (loading) {
    return <Card className="text-sm text-ink-muted">Loading form builder...</Card>;
  }
  if (error) {
    return <Card className="border-rose/40 bg-rose/10 text-sm text-rose">{error}</Card>;
  }

  if (orderedSections.length === 0) {
    return (
      <Card className="space-y-3 text-sm text-ink-muted">
        <p>No sections yet.</p>
        <Button variant="secondary" onClick={onAddSection} disabled={questionsLocked}>
          Add Section
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-14">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={orderedSections.map((section) => toSectionSortableId(section.id))}
          strategy={verticalListSortingStrategy}
        >
          {orderedSections.map((section, sectionIndex) => {
            const sectionQuestions = questions.filter(
              (question) => question.sectionId === section.id,
            );

            return (
              <BuilderSectionBlock
                key={section.id}
                section={section}
                sectionIndex={sectionIndex}
                totalSections={orderedSections.length}
                sectionQuestions={sectionQuestions}
                orderedSections={orderedSections}
                questionsLocked={questionsLocked}
                onUpdateSection={onUpdateSection}
                onMoveSection={onMoveSection}
                onDuplicateSection={onDuplicateSection}
                onRemoveSection={onRemoveSection}
                onAddQuestionToSection={onAddQuestionToSection}
                onQuestionUpdate={onQuestionUpdate}
                onDuplicateQuestion={onDuplicateQuestion}
                onRemoveQuestion={onRemoveQuestion}
                onAddOption={onAddOption}
                onUpdateOption={onUpdateOption}
                onRemoveOption={onRemoveOption}
                onMoveOption={onMoveOption}
              />
            );
          })}
        </SortableContext>
      </DndContext>
    </div>
  );
}
