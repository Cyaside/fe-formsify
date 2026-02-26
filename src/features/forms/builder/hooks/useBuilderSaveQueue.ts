"use client";

import {
  useCallback,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { ApiError } from "@/shared/api/client";
import { formsApi, type BuilderSnapshot } from "@/shared/api/forms";
import { clearDraft, saveDraft } from "@/features/forms/lib/formPersistence";
import { useFormEditorStore } from "@/features/forms/store/formEditor";
import { mapUiTypeToApiType, requiresOptions } from "../lib/constants";
import {
  DEFAULT_THANK_YOU_MESSAGE,
  DEFAULT_THANK_YOU_TITLE,
} from "../lib/formBuilderShared";
import {
  performFormBuilderSave,
  type BuilderSaveSnapshot,
} from "../lib/formBuilderPersistence";
import type { useFormCollaboration } from "../../collab/useFormCollaboration";

type BuilderCollabSaveState = Pick<
  ReturnType<typeof useFormCollaboration>,
  "connected" | "joined" | "role" | "version" | "requestSync" | "setKnownVersion"
>;

export type QueuedBuilderSaveRequest = {
  snapshot: BuilderSaveSnapshot;
  showGlobalLoading?: boolean;
};

type UseBuilderSaveQueueParams = {
  formId: string | null;
  initialFormId?: string;
  hydrated: boolean;
  isPublished: boolean;
  questionsLocked: boolean;
  enableRealtimeCollab: boolean;
  collab: BuilderCollabSaveState;
  lockedBaselineCaptured: boolean;
  lockedSectionIdSet: ReadonlySet<string>;
  lockedQuestionIdSet: ReadonlySet<string>;
  queueRef: MutableRefObject<QueuedBuilderSaveRequest | null>;
  savingRef: MutableRefObject<boolean>;
  lastSavedSnapshotKeyRef: MutableRefObject<string | null>;
  setSaveMessage: Dispatch<SetStateAction<string>>;
  setHasUnsavedChanges: Dispatch<SetStateAction<boolean>>;
  setQuestionsLocked: (value: boolean) => void;
  setQuestionsLockNote: (value: string | null) => void;
  setFormId: (id: string | null) => void;
  clearRemovedSectionIds: () => void;
  clearRemovedQuestionIds: () => void;
  replaceSectionId: (tempId: string, nextId: string) => void;
  replaceQuestionId: (tempId: string, nextId: string) => void;
  applyRemoteBuilderSnapshot: (
    source: "joined" | "sync" | "rest",
    remoteFormId: string,
    snapshot: BuilderSnapshot,
    version: number,
  ) => string;
};

type EnqueueSave = (
  snapshot: BuilderSaveSnapshot,
  options?: { showGlobalLoading?: boolean },
) => Promise<void>;

export function useBuilderSaveQueue({
  formId,
  initialFormId,
  hydrated,
  isPublished,
  questionsLocked,
  enableRealtimeCollab,
  collab,
  lockedBaselineCaptured,
  lockedSectionIdSet,
  lockedQuestionIdSet,
  queueRef,
  savingRef,
  lastSavedSnapshotKeyRef,
  setSaveMessage,
  setHasUnsavedChanges,
  setQuestionsLocked,
  setQuestionsLockNote,
  setFormId,
  clearRemovedSectionIds,
  clearRemovedQuestionIds,
  replaceSectionId,
  replaceQuestionId,
  applyRemoteBuilderSnapshot,
}: UseBuilderSaveQueueParams): { enqueueSave: EnqueueSave } {
  const {
    connected: collabConnected,
    joined: collabJoined,
    role: collabRole,
    version: collabVersion,
    requestSync,
    setKnownVersion,
  } = collab;

  const performSave = useCallback(
    async (snapshot: BuilderSaveSnapshot, options?: { showGlobalLoading?: boolean }) => {
      const performVersionedSnapshotSave = async () => {
        const latestFormId = useFormEditorStore.getState().formId ?? formId;
        const activeDraftKey = initialFormId ?? latestFormId ?? "new";
        if (!latestFormId) {
          throw new ApiError(400, "Versioned snapshot save requires a persisted form");
        }
        if (collabVersion === null) {
          throw new ApiError(409, "Collaboration version is not ready");
        }

        const normalizedResponseLimitInput = snapshot.responseLimit.trim();
        const parsedResponseLimit =
          normalizedResponseLimitInput.length === 0
            ? null
            : Number.parseInt(normalizedResponseLimitInput, 10);
        const responseLimit = Number.isFinite(parsedResponseLimit)
          ? parsedResponseLimit
          : null;

        const builderSnapshotPayload: BuilderSnapshot = {
          title: snapshot.title.trim(),
          description: snapshot.description.trim() || null,
          thankYouTitle: snapshot.thankYouTitle.trim() || DEFAULT_THANK_YOU_TITLE,
          thankYouMessage: snapshot.thankYouMessage.trim() || DEFAULT_THANK_YOU_MESSAGE,
          isClosed: snapshot.isResponseClosed,
          responseLimit,
          sections: snapshot.sections.map((section, index) => ({
            id: section.id,
            title: section.title,
            description: section.description || null,
            order: index,
          })),
          questions: snapshot.questions.map((question) => ({
            id: question.id,
            sectionId: question.sectionId,
            title: question.title,
            description: question.description || null,
            type: mapUiTypeToApiType(question.type),
            required: question.required,
            order: question.order,
            options: requiresOptions(question.type)
              ? question.options.map((item) => item.trim()).filter((item) => item.length > 0)
              : [],
          })),
        };

        setSaveMessage("Saving changes...");

        const response = await formsApi.updateBuilderSnapshot(
          latestFormId,
          {
            baseVersion: collabVersion,
            snapshot: builderSnapshotPayload,
          },
          { showGlobalLoading: options?.showGlobalLoading },
        );

        clearRemovedSectionIds();
        clearRemovedQuestionIds();
        clearDraft(activeDraftKey);
        setKnownVersion(response.data.version);
        const savedSnapshotKey = applyRemoteBuilderSnapshot(
          "rest",
          response.data.formId,
          response.data.snapshot,
          response.data.version,
        );

        return {
          status: "saved" as const,
          savedSnapshotKey,
        };
      };

      const canUseVersionedSnapshotSave =
        enableRealtimeCollab &&
        collabConnected &&
        collabJoined &&
        collabRole !== null &&
        collabVersion !== null &&
        !questionsLocked &&
        Boolean((useFormEditorStore.getState().formId ?? formId));

      if (canUseVersionedSnapshotSave) {
        try {
          const result = await performVersionedSnapshotSave();
          lastSavedSnapshotKeyRef.current = result.savedSnapshotKey;
          setHasUnsavedChanges(false);
          return;
        } catch (err) {
          if (err instanceof ApiError && err.status === 409) {
            const isVersionConflict = /version conflict/i.test(err.message);
            if (isVersionConflict) {
              setSaveMessage("Collaboration version conflict. Syncing latest changes...");
              requestSync();
              return;
            }
            if (/locked/i.test(err.message) || /responses/i.test(err.message)) {
              setQuestionsLocked(true);
              setQuestionsLockNote(err.message);
              setSaveMessage(err.message);
              requestSync();
            }
          }

          const shouldFallbackToLegacy =
            err instanceof ApiError
              ? err.status === 404 ||
                err.status === 400 ||
                (err.status === 409 && !/version conflict/i.test(err.message))
              : true;

          if (!shouldFallbackToLegacy) {
            throw err;
          }
        }
      }

      const latestFormId = useFormEditorStore.getState().formId ?? formId;
      const activeDraftKey = initialFormId ?? latestFormId ?? "new";
      const result = await performFormBuilderSave({
        snapshot,
        options,
        hydrated,
        formId: latestFormId,
        draftKey: activeDraftKey,
        questionsLocked,
        lockedSectionIds: lockedBaselineCaptured
          ? lockedSectionIdSet
          : new Set(
              snapshot.sections
                .filter((section) => !section.id.startsWith("temp_"))
                .map((section) => section.id),
            ),
        lockedQuestionIds: lockedBaselineCaptured
          ? lockedQuestionIdSet
          : new Set(
              snapshot.questions
                .filter((question) => !question.id.startsWith("temp_"))
                .map((question) => question.id),
            ),
        setSaveMessage,
        setFormId,
        setQuestionsLocked,
        setQuestionsLockNote,
        clearRemovedSectionIds,
        clearRemovedQuestionIds,
        replaceSectionId,
        replaceQuestionId,
      });

      if (result.status === "saved") {
        lastSavedSnapshotKeyRef.current = result.savedSnapshotKey;
        setHasUnsavedChanges(false);
      }
    },
    [
      applyRemoteBuilderSnapshot,
      clearRemovedQuestionIds,
      clearRemovedSectionIds,
      collabConnected,
      collabJoined,
      collabRole,
      collabVersion,
      enableRealtimeCollab,
      formId,
      hydrated,
      initialFormId,
      lastSavedSnapshotKeyRef,
      lockedBaselineCaptured,
      lockedQuestionIdSet,
      lockedSectionIdSet,
      questionsLocked,
      replaceQuestionId,
      replaceSectionId,
      requestSync,
      setFormId,
      setHasUnsavedChanges,
      setKnownVersion,
      setQuestionsLockNote,
      setQuestionsLocked,
      setSaveMessage,
    ],
  );

  const enqueueSave = useCallback<EnqueueSave>(
    async (snapshot, options) => {
      const latestFormId = useFormEditorStore.getState().formId ?? formId;
      const activeDraftKey = initialFormId ?? latestFormId ?? "new";
      saveDraft(activeDraftKey, {
        formId: latestFormId,
        isPublished,
        title: snapshot.title,
        description: snapshot.description,
        thankYouTitle: snapshot.thankYouTitle,
        thankYouMessage: snapshot.thankYouMessage,
        isResponseClosed: snapshot.isResponseClosed,
        responseLimit: snapshot.responseLimit,
        sections: snapshot.sections,
        questions: snapshot.questions,
        removedSectionIds: snapshot.removedSectionIds,
        removedQuestionIds: snapshot.removedQuestionIds,
      });

      if (savingRef.current) {
        queueRef.current = {
          snapshot,
          showGlobalLoading: options?.showGlobalLoading,
        };
        return;
      }

      savingRef.current = true;
      try {
        await performSave(snapshot, options);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Failed to autosave";
        setSaveMessage(message);
        if (options?.showGlobalLoading) {
          throw err;
        }
      } finally {
        savingRef.current = false;
      }

      if (queueRef.current) {
        const queued = queueRef.current;
        queueRef.current = null;
        await enqueueSave(queued.snapshot, {
          showGlobalLoading: queued.showGlobalLoading,
        });
      }
    },
    [
      formId,
      initialFormId,
      isPublished,
      performSave,
      queueRef,
      savingRef,
      setSaveMessage,
    ],
  );

  return { enqueueSave };
}
