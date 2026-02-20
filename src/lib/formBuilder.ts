import type { EditorQuestion, QuestionType } from "@/store/formEditor";

export const QUESTION_TYPE_OPTIONS: Array<{
  value: QuestionType;
  label: string;
  hint: string;
}> = [
  {
    value: "SHORT_ANSWER",
    label: "Jawaban singkat",
    hint: "Respon pendek satu baris.",
  },
  {
    value: "PARAGRAPH",
    label: "Paragraf",
    hint: "Respon panjang berbentuk paragraf.",
  },
  {
    value: "MCQ",
    label: "Pilihan ganda",
    hint: "Pilih satu dari beberapa opsi.",
  },
  {
    value: "CHECKBOX",
    label: "Kotak centang",
    hint: "Pilih lebih dari satu opsi.",
  },
  {
    value: "DROPDOWN",
    label: "Dropdown",
    hint: "Pilih dari menu dropdown.",
  },
];

export const isOptionType = (type: QuestionType) =>
  type === "MCQ" || type === "CHECKBOX" || type === "DROPDOWN";

export const mapQuestionTypeForApi = (type: QuestionType) =>
  type === "PARAGRAPH" ? "SHORT_ANSWER" : type;

export const getQuestionTypeLabel = (type: QuestionType) =>
  QUESTION_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;

export const createEmptyQuestion = (
  overrides: Partial<EditorQuestion> = {},
): EditorQuestion => {
  const type = overrides.type ?? "SHORT_ANSWER";
  return {
    id: overrides.id ?? `temp_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    title: overrides.title ?? "",
    description: overrides.description ?? "",
    type,
    required: overrides.required ?? false,
    order: overrides.order ?? 0,
    options: overrides.options ?? (isOptionType(type) ? ["Opsi 1"] : []),
  };
};
