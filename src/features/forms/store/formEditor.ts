import { create } from "zustand";

export type ApiQuestionType =
  | "SHORT_ANSWER"
  | "PARAGRAPH"
  | "MCQ"
  | "CHECKBOX"
  | "DROPDOWN";

export type QuestionType =
  | "SHORT_ANSWER"
  | "PARAGRAPH"
  | "MCQ"
  | "CHECKBOX"
  | "DROPDOWN";

export type EditorSection = {
  id: string;
  title: string;
  description: string;
  order: number;
};

export type EditorQuestion = {
  id: string;
  sectionId: string;
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
  sections: EditorSection[];
  questions: EditorQuestion[];
  removedSectionIds: string[];
  removedQuestionIds: string[];
  hydrated: boolean;
  setFormId: (id: string | null) => void;
  setHydrated: (value: boolean) => void;
  setFormMeta: (title: string, description: string) => void;
  setSections: (sections: EditorSection[]) => void;
  addSection: (section: EditorSection) => void;
  duplicateSection: (id: string) => void;
  updateSection: (id: string, next: Partial<EditorSection>) => void;
  moveSection: (id: string, direction: -1 | 1) => void;
  removeSection: (id: string) => void;
  replaceSectionId: (tempId: string, nextId: string) => void;
  setQuestions: (questions: EditorQuestion[]) => void;
  reorderQuestions: (fromIndex: number, toIndex: number) => void;
  setSnapshot: (snapshot: {
    formId: string | null;
    title: string;
    description: string;
    sections: EditorSection[];
    questions: EditorQuestion[];
    removedSectionIds: string[];
    removedQuestionIds: string[];
    hydrated?: boolean;
  }) => void;
  replaceQuestionId: (tempId: string, nextId: string) => void;
  addQuestion: (question: EditorQuestion) => void;
  duplicateQuestion: (id: string) => void;
  updateQuestion: (id: string, next: Partial<EditorQuestion>) => void;
  removeQuestion: (id: string) => void;
  clearRemovedSectionIds: () => void;
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
  return normalizeQuestionOrders(next);
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

const normalizeSectionOrders = (sections: EditorSection[]) => {
  return sections.map((section, index) => ({
    ...section,
    order: index,
  }));
};

const normalizeQuestionOrders = (questions: EditorQuestion[]) => {
  const counters = new Map<string, number>();
  return questions.map((question) => {
    const nextOrder = counters.get(question.sectionId) ?? 0;
    counters.set(question.sectionId, nextOrder + 1);
    if (question.order === nextOrder) return question;
    return { ...question, order: nextOrder };
  });
};

const countQuestionsInSection = (questions: EditorQuestion[], sectionId: string) =>
  questions.filter((question) => question.sectionId === sectionId).length;

export const useFormEditorStore = create<EditorState>((set) => ({
  formId: null,
  title: "",
  description: "",
  sections: [],
  questions: [],
  removedSectionIds: [],
  removedQuestionIds: [],
  hydrated: false,
  setFormId: (id) => set({ formId: id }),
  setHydrated: (value) => set({ hydrated: value }),
  setFormMeta: (title, description) => set({ title, description }),
  setSections: (sections) => set({ sections: normalizeSectionOrders(sections) }),
  addSection: (section) =>
    set((state) => ({
      sections: normalizeSectionOrders([...state.sections, section]),
    })),
  duplicateSection: (id) =>
    set((state) => {
      const sectionIndex = state.sections.findIndex((section) => section.id === id);
      if (sectionIndex === -1) return state;

      const sourceSection = state.sections[sectionIndex];
      const nextSectionId = createTempId();
      const duplicatedSection: EditorSection = {
        ...sourceSection,
        id: nextSectionId,
        title: sourceSection.title.trim()
          ? `${sourceSection.title} (Copy)`
          : "Section Copy",
      };

      const nextSections = [...state.sections];
      nextSections.splice(sectionIndex + 1, 0, duplicatedSection);

      const sourceQuestions = state.questions.filter(
        (question) => question.sectionId === sourceSection.id,
      );
      if (sourceQuestions.length === 0) {
        return {
          sections: normalizeSectionOrders(nextSections),
        };
      }

      const duplicatedQuestions = sourceQuestions.map((question) => ({
        ...question,
        id: createTempId(),
        sectionId: nextSectionId,
      }));

      const insertIndex =
        state.questions.reduce((lastIndex, question, index) => {
          if (question.sectionId === sourceSection.id) return index + 1;
          return lastIndex;
        }, -1) || state.questions.length;

      const nextQuestions = [...state.questions];
      nextQuestions.splice(insertIndex, 0, ...duplicatedQuestions);

      return {
        sections: normalizeSectionOrders(nextSections),
        questions: normalizeQuestionOrders(nextQuestions),
      };
    }),
  updateSection: (id, next) =>
    set((state) => ({
      sections: state.sections.map((section) =>
        section.id === id ? { ...section, ...next } : section,
      ),
    })),
  moveSection: (id, direction) =>
    set((state) => {
      const index = state.sections.findIndex((section) => section.id === id);
      if (index === -1) return state;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= state.sections.length) return state;
      const next = [...state.sections];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return { sections: normalizeSectionOrders(next) };
    }),
  removeSection: (id) =>
    set((state) => ({
      sections: normalizeSectionOrders(state.sections.filter((section) => section.id !== id)),
      removedSectionIds: id.startsWith("temp_")
        ? state.removedSectionIds
        : [...state.removedSectionIds, id],
    })),
  replaceSectionId: (tempId, nextId) =>
    set((state) => ({
      sections: state.sections.map((section) =>
        section.id === tempId ? { ...section, id: nextId } : section,
      ),
      questions: state.questions.map((question) =>
        question.sectionId === tempId ? { ...question, sectionId: nextId } : question,
      ),
    })),
  setQuestions: (questions) => set({ questions: normalizeQuestionOrders(questions) }),
  reorderQuestions: (fromIndex, toIndex) =>
    set((state) => ({
      questions: reorderQuestions(state.questions, fromIndex, toIndex),
    })),
  setSnapshot: (snapshot) =>
    set({
      formId: snapshot.formId,
      title: snapshot.title,
      description: snapshot.description,
      sections: normalizeSectionOrders(snapshot.sections),
      questions: normalizeQuestionOrders(snapshot.questions),
      removedSectionIds: snapshot.removedSectionIds,
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
      questions: normalizeQuestionOrders([
        ...state.questions,
        {
          ...question,
          order: countQuestionsInSection(state.questions, question.sectionId),
        },
      ]),
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
        questions: normalizeQuestionOrders(next),
      };
    }),
  updateQuestion: (id, next) =>
    set((state) => ({
      questions: normalizeQuestionOrders(
        state.questions.map((question) =>
          question.id === id ? { ...question, ...next } : question,
        ),
      ),
    })),
  removeQuestion: (id) =>
    set((state) => ({
      questions: normalizeQuestionOrders(
        state.questions.filter((question) => question.id !== id),
      ),
      removedQuestionIds: id.startsWith("temp_")
        ? state.removedQuestionIds
        : [...state.removedQuestionIds, id],
    })),
  clearRemovedSectionIds: () => set({ removedSectionIds: [] }),
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
      sections: [],
      questions: [],
      removedSectionIds: [],
      removedQuestionIds: [],
      hydrated: false,
    }),
}));
