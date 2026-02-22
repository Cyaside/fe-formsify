"use client";

import type { ReactNode } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  EditorQuestion,
  EditorSection,
} from "@/features/forms/store/formEditor";
import QuestionCard from "./QuestionCard";
import { toQuestionSortableId, toSectionSortableId } from "../lib/formBuilderShared";

type SortableQuestionItemProps = Readonly<{
  index: number;
  question: EditorQuestion;
  sections: EditorSection[];
  onUpdate: (id: string, value: Partial<EditorQuestion>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onAddOption: (id: string) => void;
  onUpdateOption: (id: string, optionIndex: number, label: string) => void;
  onRemoveOption: (id: string, optionIndex: number) => void;
  onMoveOption: (id: string, fromIndex: number, toIndex: number) => void;
  readOnly?: boolean;
}>;

export function SortableQuestionItem({
  index,
  question,
  sections,
  onUpdate,
  onDuplicate,
  onDelete,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onMoveOption,
  readOnly = false,
}: SortableQuestionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: toQuestionSortableId(question.id),
    disabled: readOnly,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <QuestionCard
        index={index}
        question={question}
        sections={sections}
        dragAttributes={attributes}
        dragListeners={listeners}
        onUpdate={onUpdate}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onAddOption={onAddOption}
        onUpdateOption={onUpdateOption}
        onRemoveOption={onRemoveOption}
        onMoveOption={onMoveOption}
        readOnly={readOnly}
      />
    </div>
  );
}

type SortableSectionContainerProps = Readonly<{
  sectionId: string;
  readOnly?: boolean;
  children: (args: {
    dragAttributes?: DraggableAttributes;
    dragListeners?: SyntheticListenerMap;
  }) => ReactNode;
}>;

export function SortableSectionContainer({
  sectionId,
  readOnly = false,
  children,
}: SortableSectionContainerProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: toSectionSortableId(sectionId),
    disabled: readOnly,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {children({
        dragAttributes: readOnly ? undefined : attributes,
        dragListeners: readOnly ? undefined : listeners,
      })}
    </div>
  );
}
