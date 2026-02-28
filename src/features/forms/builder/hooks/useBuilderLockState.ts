"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { EditorQuestion, EditorSection } from "@/features/forms/store/formEditor";
import type { QueuedBuilderSaveRequest } from "./useBuilderSaveQueue";

type UseBuilderLockStateParams = {
  initialFormId?: string;
  questionsLocked: boolean;
  questionsLockNote: string | null;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  sections: EditorSection[];
  questions: EditorQuestion[];
  queueRef: MutableRefObject<QueuedBuilderSaveRequest | null>;
  savingRef: MutableRefObject<boolean>;
  lastSavedSnapshotKeyRef: MutableRefObject<string | null>;
  setHasUnsavedChanges: Dispatch<SetStateAction<boolean>>;
  setSaveMessage: Dispatch<SetStateAction<string>>;
};

type UseBuilderLockStateResult = {
  lockedBaselineCaptured: boolean;
  lockedSectionIdSet: ReadonlySet<string>;
  lockedQuestionIdSet: ReadonlySet<string>;
  isLockedSectionId: (id: string) => boolean;
  isLockedQuestionId: (id: string) => boolean;
};

type BuilderLockLocalState = {
  lockedBaselineCaptured: boolean;
  lockedSectionIds: string[];
  lockedQuestionIds: string[];
};

type BuilderLockAction =
  | { type: "reset" }
  | { type: "capture"; sectionIds: string[]; questionIds: string[] };

const initialBuilderLockState: BuilderLockLocalState = {
  lockedBaselineCaptured: false,
  lockedSectionIds: [],
  lockedQuestionIds: [],
};

const builderLockReducer = (
  state: BuilderLockLocalState,
  action: BuilderLockAction,
): BuilderLockLocalState => {
  switch (action.type) {
    case "reset":
      return initialBuilderLockState;
    case "capture":
      return {
        lockedBaselineCaptured: true,
        lockedSectionIds: action.sectionIds,
        lockedQuestionIds: action.questionIds,
      };
    default:
      return state;
  }
};

export function useBuilderLockState({
  initialFormId,
  questionsLocked,
  questionsLockNote,
  hydrated,
  loading,
  error,
  sections,
  questions,
  queueRef,
  savingRef,
  lastSavedSnapshotKeyRef,
  setHasUnsavedChanges,
  setSaveMessage,
}: UseBuilderLockStateParams): UseBuilderLockStateResult {
  const [lockState, dispatchLock] = useReducer(
    builderLockReducer,
    initialBuilderLockState,
  );
  const { lockedBaselineCaptured, lockedSectionIds, lockedQuestionIds } = lockState;

  const lockedSectionIdSet = useMemo(() => new Set(lockedSectionIds), [lockedSectionIds]);
  const lockedQuestionIdSet = useMemo(() => new Set(lockedQuestionIds), [lockedQuestionIds]);

  useEffect(() => {
    queueRef.current = null;
    savingRef.current = false;
    lastSavedSnapshotKeyRef.current = null;
    setHasUnsavedChanges(false);
    setSaveMessage("Ready");
    dispatchLock({ type: "reset" });
  }, [
    initialFormId,
    lastSavedSnapshotKeyRef,
    queueRef,
    savingRef,
    setHasUnsavedChanges,
    setSaveMessage,
  ]);

  useEffect(() => {
    if (!questionsLocked) {
      dispatchLock({ type: "reset" });
      return;
    }
    if (lockedBaselineCaptured) return;
    if (!hydrated || loading || error) return;
    dispatchLock({
      type: "capture",
      sectionIds: sections
        .filter((section) => !section.id.startsWith("temp_"))
        .map((section) => section.id),
      questionIds: questions
        .filter((question) => !question.id.startsWith("temp_"))
        .map((question) => question.id),
    });
  }, [
    error,
    hydrated,
    loading,
    lockedBaselineCaptured,
    questions,
    questionsLocked,
    sections,
  ]);

  useEffect(() => {
    if (!questionsLockNote) return;
    queueRef.current = null;
    setHasUnsavedChanges(false);
    setSaveMessage(questionsLockNote);
  }, [questionsLockNote, queueRef, setHasUnsavedChanges, setSaveMessage]);

  const isLockedSectionId = useCallback(
    (id: string) =>
      questionsLocked &&
      (lockedBaselineCaptured ? lockedSectionIdSet.has(id) : !id.startsWith("temp_")),
    [lockedBaselineCaptured, lockedSectionIdSet, questionsLocked],
  );

  const isLockedQuestionId = useCallback(
    (id: string) =>
      questionsLocked &&
      (lockedBaselineCaptured ? lockedQuestionIdSet.has(id) : !id.startsWith("temp_")),
    [lockedBaselineCaptured, lockedQuestionIdSet, questionsLocked],
  );

  return {
    lockedBaselineCaptured,
    lockedSectionIdSet,
    lockedQuestionIdSet,
    isLockedSectionId,
    isLockedQuestionId,
  };
}
