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

export const DEFAULT_THANK_YOU_TITLE = "Terima kasih!";
export const DEFAULT_THANK_YOU_MESSAGE = "Respons kamu sudah terekam.";
export const QUESTION_LOCK_MESSAGE =
  "Sorry the forms already has submission you cant edit, create and delete the questions it anymore";
export const PUBLISH_NO_QUESTION_MESSAGE =
  "Tambahkan minimal satu pertanyaan sebelum publish.";

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
    return "Judul form wajib diisi sebelum publish.";
  }

  if (payload.sections.length === 0) {
    return "Form harus memiliki minimal satu section sebelum publish.";
  }

  if (payload.questions.length === 0) {
    return PUBLISH_NO_QUESTION_MESSAGE;
  }

  const sectionIds = new Set(payload.sections.map((section) => section.id));
  for (const question of payload.questions) {
    if (!sectionIds.has(question.sectionId)) {
      return "Ada pertanyaan yang belum terhubung ke section yang valid.";
    }
    if (!question.title.trim()) {
      return "Semua pertanyaan harus memiliki judul sebelum publish.";
    }
    if (requiresOptions(question.type)) {
      const validOptions = question.options.filter((option) => option.trim().length > 0);
      if (validOptions.length === 0) {
        return "Pertanyaan pilihan wajib memiliki minimal satu opsi.";
      }
    }
  }

  return null;
};

export const resolveBuilderActionErrorMessage = (err: unknown, fallback: string) => {
  if (!(err instanceof ApiError)) return fallback;
  if (err.status === 409) {
    return "Form sudah memiliki respons. Struktur pertanyaan tidak bisa diubah lagi.";
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
