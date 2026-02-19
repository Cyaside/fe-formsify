import { create } from "zustand";

export type QuestionType = "SHORT_TEXT" | "MULTIPLE_CHOICE" | "CHECKBOX" | "DROPDOWN";

export type EditorQuestion = {
  id: string;
  title: string;
  description: string;
  type: QuestionType;
  required: boolean;
  order: number;
  options: string[];
};

type EditorState = {
  formId: string | null;
  title: string;
  description: string;
  questions: EditorQuestion[];
  removedQuestionIds: string[];
  setFormId: (id: string | null) => void;
  setFormMeta: (title: string, description: string) => void;
  setQuestions: (questions: EditorQuestion[]) => void;
  replaceQuestionId: (tempId: string, nextId: string) => void;
  addQuestion: (question: EditorQuestion) => void;
  updateQuestion: (id: string, next: Partial<EditorQuestion>) => void;
  removeQuestion: (id: string) => void;
  clearRemovedQuestionIds: () => void;
  addOption: (id: string, label?: string) => void;
  updateOption: (id: string, index: number, label: string) => void;
  removeOption: (id: string, index: number) => void;
  moveOption: (id: string, fromIndex: number, toIndex: number) => void;
  reset: () => void;
};

const reorderOptions = (options: string[], fromIndex: number, toIndex: number) => {
  if (toIndex < 0 || toIndex >= options.length) return options;
  const next = [...options];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
};

export const useFormEditorStore = create<EditorState>((set) => ({
  formId: null,
  title: "",
  description: "",
  questions: [],
  removedQuestionIds: [],
  setFormId: (id) => set({ formId: id }),
  setFormMeta: (title, description) => set({ title, description }),
  setQuestions: (questions) => set({ questions }),
  replaceQuestionId: (tempId, nextId) =>
    set((state) => ({
      questions: state.questions.map((question) =>
        question.id === tempId ? { ...question, id: nextId } : question,
      ),
    })),
  addQuestion: (question) =>
    set((state) => ({
      questions: [...state.questions, question],
    })),
  updateQuestion: (id, next) =>
    set((state) => ({
      questions: state.questions.map((question) =>
        question.id === id ? { ...question, ...next } : question,
      ),
    })),
  removeQuestion: (id) =>
    set((state) => ({
      questions: state.questions.filter((question) => question.id !== id),
      removedQuestionIds: id.startsWith("temp_")
        ? state.removedQuestionIds
        : [...state.removedQuestionIds, id],
    })),
  clearRemovedQuestionIds: () => set({ removedQuestionIds: [] }),
  addOption: (id, label = "") =>
    set((state) => ({
      questions: state.questions.map((question) =>
        question.id === id
          ? { ...question, options: [...question.options, label] }
          : question,
      ),
    })),
  updateOption: (id, index, label) =>
    set((state) => ({
      questions: state.questions.map((question) =>
        question.id === id
          ? {
              ...question,
              options: question.options.map((option, idx) =>
                idx === index ? label : option,
              ),
            }
          : question,
      ),
    })),
  removeOption: (id, index) =>
    set((state) => ({
      questions: state.questions.map((question) =>
        question.id === id
          ? {
              ...question,
              options: question.options.filter((_option, idx) => idx !== index),
            }
          : question,
      ),
    })),
  moveOption: (id, fromIndex, toIndex) =>
    set((state) => ({
      questions: state.questions.map((question) =>
        question.id === id
          ? {
              ...question,
              options: reorderOptions(question.options, fromIndex, toIndex),
            }
          : question,
      ),
    })),
  reset: () =>
    set({
      formId: null,
      title: "",
      description: "",
      questions: [],
      removedQuestionIds: [],
    }),
}));
