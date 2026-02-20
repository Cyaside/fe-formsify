import type { EditorQuestion } from "@/store/formEditor";

const DRAFT_PREFIX = "formsify:draft:";

type DraftSnapshot = {
  formId: string | null;
  title: string;
  description: string;
  questions: EditorQuestion[];
  removedQuestionIds: string[];
};

const isClient = () => globalThis.window !== undefined;

export const getDraftKey = (key: string) => `${DRAFT_PREFIX}${key}`;

export function saveDraft(key: string, value: DraftSnapshot) {
  if (!isClient()) return;
  globalThis.window.localStorage.setItem(getDraftKey(key), JSON.stringify(value));
}

export function loadDraft(key: string): DraftSnapshot | null {
  if (!isClient()) return null;
  const raw = globalThis.window.localStorage.getItem(getDraftKey(key));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DraftSnapshot;
  } catch {
    return null;
  }
}

export function clearDraft(key: string) {
  if (!isClient()) return;
  globalThis.window.localStorage.removeItem(getDraftKey(key));
}
