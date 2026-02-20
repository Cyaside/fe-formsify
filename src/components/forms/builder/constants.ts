import type { ApiQuestionType, QuestionType } from "@/store/formEditor";

export const QUESTION_TYPE_OPTIONS: Array<{ value: QuestionType; label: string }> = [
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "PARAGRAPH", label: "Paragraph" },
  { value: "MCQ", label: "Multiple Choice" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "DROPDOWN", label: "Dropdown" },
];

export const DEFAULT_FORM_TITLE = "Untitled Form";
export const DEFAULT_QUESTION_TITLE = "Untitled Question";

export const createTempId = () => `temp_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export const requiresOptions = (type: QuestionType) =>
  type === "MCQ" || type === "CHECKBOX" || type === "DROPDOWN";

export const mapUiTypeToApiType = (type: QuestionType): ApiQuestionType => {
  if (type === "PARAGRAPH") return "SHORT_ANSWER";
  return type;
};
