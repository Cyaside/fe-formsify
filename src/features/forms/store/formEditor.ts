import { create } from "zustand";

export type ApiQuestionType = "SHORT_ANSWER" | "MCQ" | "CHECKBOX" | "DROPDOWN";

export type QuestionType =
  | "SHORT_ANSWER"
  | "PARAGRAPH"
  | "MCQ"
  | "CHECKBOX"
  | "DROPDOWN";

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
  hydrated: boolean;
  setFormId: (id: string | null) => void;
  setHydrated: (value: boolean) => void;
  setFormMeta: (title: string, description: string) => void;
  setQuestions: (questions: EditorQuestion[]) => void;
  reorderQuestions: (fromIndex: number, toIndex: number) => void;
  setSnapshot: (snapshot: {
    formId: string | null;
    title: string;
    description: string;
    questions: EditorQuestion[];
    removedQuestionIds: string[];
    hydrated?: boolean;
  }) => void;
  replaceQuestionId: (tempId: string, nextId: string) => void;
  addQuestion: (question: EditorQuestion) => void;
  duplicateQuestion: (id: string) => void;
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

const reorderQuestions = (
  questions: EditorQuestion[],
  fromIndex: number,
  toIndex: number,
) => {
  if (toIndex < 0 || toIndex >= questions.length || fromIndex === toIndex) {
    return questions;
  }
  const next = [...questions];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next.map((question, index) => ({ ...question, order: index }));
};

const createTempId = () => `temp_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const mapQuestions = (
  questions: EditorQuestion[],
  id: string,
  transform: (question: EditorQuestion) => EditorQuestion,
) => {
  return questions.map((question) =>
    question.id === id ? transform(question) : question,
  );
};

const replaceOptionAt = (options: string[], index: number, label: string) => {
  return options.map((option, optionIndex) =>
    optionIndex === index ? label : option,
  );
};

const removeOptionAt = (options: string[], index: number) => {
  return options.filter((_option, optionIndex) => optionIndex !== index);
};

export const useFormEditorStore = create<EditorState>((set) => ({
  formId: null,
  title: "",
  description: "",
  questions: [],
  removedQuestionIds: [],
  hydrated: false,
  setFormId: (id) => set({ formId: id }),
  setHydrated: (value) => set({ hydrated: value }),
  setFormMeta: (title, description) => set({ title, description }),
  setQuestions: (questions) => set({ questions }),
  reorderQuestions: (fromIndex, toIndex) =>
    set((state) => ({
      questions: reorderQuestions(state.questions, fromIndex, toIndex),
    })),
  setSnapshot: (snapshot) =>
    set({
      formId: snapshot.formId,
      title: snapshot.title,
      description: snapshot.description,
      questions: snapshot.questions,
      removedQuestionIds: snapshot.removedQuestionIds,
      hydrated: snapshot.hydrated ?? true,
    }),
  replaceQuestionId: (tempId, nextId) =>
    set((state) => ({
      questions: state.questions.map((question) =>
        question.id === tempId ? { ...question, id: nextId } : question,
      ),
    })),
  addQuestion: (question) =>
    set((state) => ({
      questions: [...state.questions, { ...question, order: state.questions.length }],
    })),
  duplicateQuestion: (id) =>
    set((state) => {
      const index = state.questions.findIndex((question) => question.id === id);
      if (index === -1) return state;

      const source = state.questions[index];
      const duplicate: EditorQuestion = {
        ...source,
        id: createTempId(),
      };

      const next = [...state.questions];
      next.splice(index + 1, 0, duplicate);

      return {
        questions: next.map((question, itemIndex) => ({
          ...question,
          order: itemIndex,
        })),
      };
    }),
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
      questions: mapQuestions(state.questions, id, (question) => ({
        ...question,
        options: [...question.options, label],
      })),
    })),
  updateOption: (id, index, label) =>
    set((state) => ({
      questions: mapQuestions(state.questions, id, (question) => ({
        ...question,
        options: replaceOptionAt(question.options, index, label),
      })),
    })),
  removeOption: (id, index) =>
    set((state) => ({
      questions: mapQuestions(state.questions, id, (question) => ({
        ...question,
        options: removeOptionAt(question.options, index),
      })),
    })),
  moveOption: (id, fromIndex, toIndex) =>
    set((state) => ({
      questions: mapQuestions(state.questions, id, (question) => ({
        ...question,
        options: reorderOptions(question.options, fromIndex, toIndex),
      })),
    })),
  reset: () =>
    set({
      formId: null,
      title: "",
      description: "",
      questions: [],
      removedQuestionIds: [],
      hydrated: false,
    }),
}));
