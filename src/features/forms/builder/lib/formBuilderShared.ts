import { ApiError } from "@/shared/api/client";
import type { Question, Section } from "@/shared/api/forms";
import type {
  EditorQuestion,
  EditorSection,
  QuestionType,
} from "@/features/forms/store/formEditor";
import {
  createTempId,
  DEFAULT_QUESTION_TITLE,
  DEFAULT_SECTION_TITLE,
  requiresOptions,
} from "./constants";

export const DEFAULT_THANK_YOU_TITLE = "Thank you!";
export const DEFAULT_THANK_YOU_MESSAGE = "Your response has been recorded.";
export const QUESTION_LOCK_MESSAGE =
  "This form already has submissions, so questions can no longer be created, edited, or deleted.";
export const PUBLISH_NO_QUESTION_MESSAGE =
  "Add at least one question before publishing.";

export const SECTION_SORTABLE_PREFIX = "section:";
export const QUESTION_SORTABLE_PREFIX = "question:";

export const toSectionSortableId = (id: string) => `${SECTION_SORTABLE_PREFIX}${id}`;
export const toQuestionSortableId = (id: string) => `${QUESTION_SORTABLE_PREFIX}${id}`;
export const fromSortableId = (rawId: string, prefix: string) =>
  rawId.startsWith(prefix) ? rawId.slice(prefix.length) : null;

const mapOptionLabels = (options: Question["options"]) => {
  return options.toSorted((a, b) => a.order - b.order).map((item) => item.label);
};

export const mapApiSectionToEditor = (
  section: Section,
  index: number,
): EditorSection => ({
  id: section.id,
  title: section.title,
  description: section.description ?? "",
  order: index,
});

export const mapApiQuestionToEditor = (
  question: Question,
  index: number,
): EditorQuestion => ({
  id: question.id,
  sectionId: question.sectionId,
  title: question.title,
  description: question.description ?? "",
  type: question.type,
  required: question.required,
  order: index,
  options: mapOptionLabels(question.options),
});

export const getPublishValidationMessage = (payload: {
  title: string;
  sections: EditorSection[];
  questions: EditorQuestion[];
}) => {
  if (!payload.title.trim()) {
    return "Form title is required before publishing.";
  }

  if (payload.sections.length === 0) {
    return "A form must have at least one section before publishing.";
  }

  if (payload.questions.length === 0) {
    return PUBLISH_NO_QUESTION_MESSAGE;
  }

  const sectionIds = new Set(payload.sections.map((section) => section.id));
  for (const question of payload.questions) {
    if (!sectionIds.has(question.sectionId)) {
      return "There is a question that is not linked to a valid section.";
    }
    if (!question.title.trim()) {
      return "All questions must have a title before publishing.";
    }
    if (requiresOptions(question.type)) {
      const validOptions = question.options.filter((option) => option.trim().length > 0);
      if (validOptions.length === 0) {
        return "Choice questions must have at least one option.";
      }
    }
  }

  return null;
};

export const resolveBuilderActionErrorMessage = (err: unknown, fallback: string) => {
  if (!(err instanceof ApiError)) return fallback;
  if (err.status === 409) {
    return "This form already has responses. The question structure can no longer be changed.";
  }
  return err.message || fallback;
};

export function createDefaultSection(index: number): EditorSection {
  return {
    id: createTempId(),
    title: index === 0 ? DEFAULT_SECTION_TITLE : `Section ${index + 1}`,
    description: "",
    order: index,
  };
}

export function createDefaultQuestion(
  sectionId: string,
  type: QuestionType = "SHORT_ANSWER",
): EditorQuestion {
  return {
    id: createTempId(),
    sectionId,
    title: DEFAULT_QUESTION_TITLE,
    description: "",
    type,
    required: false,
    order: 0,
    options: requiresOptions(type) ? ["Option 1"] : [],
  };
}
