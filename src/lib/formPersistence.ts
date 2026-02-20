import type { EditorQuestion } from "@/store/formEditor";

const DRAFT_PREFIX = "formsify:draft:";
const STATUS_KEY = "formsify:status-map";

type DraftSnapshot = {
  formId: string | null;
  title: string;
  description: string;
  questions: EditorQuestion[];
  removedQuestionIds: string[];
};

type FormStatus = "draft" | "published";
type FormStatusMap = Record<string, FormStatus>;

const isClient = () => typeof window !== "undefined";

export const getDraftKey = (key: string) => `${DRAFT_PREFIX}${key}`;

export function saveDraft(key: string, value: DraftSnapshot) {
  if (!isClient()) return;
  window.localStorage.setItem(getDraftKey(key), JSON.stringify(value));
}

export function loadDraft(key: string): DraftSnapshot | null {
  if (!isClient()) return null;
  const raw = window.localStorage.getItem(getDraftKey(key));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DraftSnapshot;
  } catch {
    return null;
  }
}

export function clearDraft(key: string) {
  if (!isClient()) return;
  window.localStorage.removeItem(getDraftKey(key));
}

export function getFormStatusMap(): FormStatusMap {
  if (!isClient()) return {};
  const raw = window.localStorage.getItem(STATUS_KEY);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as FormStatusMap;
  } catch {
    return {};
  }
}

export function getFormStatus(formId: string): FormStatus {
  return getFormStatusMap()[formId] ?? "draft";
}

export function setFormStatus(formId: string, status: FormStatus) {
  if (!isClient()) return;
  const map = getFormStatusMap();
  map[formId] = status;
  window.localStorage.setItem(STATUS_KEY, JSON.stringify(map));
}
