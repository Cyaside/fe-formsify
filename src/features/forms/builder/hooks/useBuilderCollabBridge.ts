"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { BuilderSnapshot } from "@/shared/api/forms";
import {
  useFormEditorStore,
  type EditorQuestion,
  type EditorSection,
} from "@/features/forms/store/formEditor";
import {
  createSavedSnapshotKey,
  type BuilderSaveSnapshot,
} from "../lib/formBuilderPersistence";
import {
  mapBuilderSnapshotQuestionToEditor,
  mapBuilderSnapshotSectionToEditor,
} from "../lib/formBuilderShared";
import type { useFormCollaboration } from "../../collab/useFormCollaboration";
import type { CollabEditingTarget } from "../../collab/types";

type BuilderCollabState = ReturnType<typeof useFormCollaboration>;
type BuilderFieldTarget = Exclude<CollabEditingTarget, null>;

type SnapshotSetter = (snapshot: {
  formId: string | null;
  title: string;
  description: string;
  sections: EditorSection[];
  questions: EditorQuestion[];
  removedSectionIds: string[];
  removedQuestionIds: string[];
  hydrated?: boolean;
}) => void;

type UseBuilderCollabBridgeParams = {
  collab: BuilderCollabState;
  userId?: string;
  formId: string | null;
  resetKey?: string;
  enableRealtimeCollab: boolean;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  publishing: boolean;
  savingDraft: boolean;
  savePayload: BuilderSaveSnapshot;
  savePayloadKey: string;
  savingRef: MutableRefObject<boolean>;
  lastSavedSnapshotKeyRef: MutableRefObject<string | null>;
  setSaveMessage: Dispatch<SetStateAction<string>>;
  setHasUnsavedChanges: Dispatch<SetStateAction<boolean>>;
  setSnapshot: SnapshotSetter;
  setThankYouTitle: (value: string) => void;
  setThankYouMessage: (value: string) => void;
  setIsResponseClosed: (value: boolean) => void;
  setResponseLimit: (value: string) => void;
  setQuestionsLocked: (value: boolean) => void;
  setQuestionsLockNote: (value: string | null) => void;
};

type CollabPreviewReplacePayload = {
  title: string;
  description: string;
  thankYouTitle: string;
  thankYouMessage: string;
  isResponseClosed: boolean;
  responseLimit: string;
  sections: EditorSection[];
  questions: EditorQuestion[];
};

type UseBuilderCollabBridgeResult = {
  applyRemoteBuilderSnapshot: (
    source: "joined" | "sync" | "rest",
    remoteFormId: string,
    snapshot: BuilderSnapshot,
    version: number,
  ) => string;
  handleCollabFieldFocus: (target: BuilderFieldTarget) => void;
  handleCollabFieldBlur: () => void;
  getCollabEditorsLabel: (target: BuilderFieldTarget) => string | null;
};

export function useBuilderCollabBridge({
  collab,
  userId,
  formId,
  resetKey,
  enableRealtimeCollab,
  hydrated,
  loading,
  error,
  publishing,
  savingDraft,
  savePayload,
  savePayloadKey,
  savingRef,
  lastSavedSnapshotKeyRef,
  setSaveMessage,
  setHasUnsavedChanges,
  setSnapshot,
  setThankYouTitle,
  setThankYouMessage,
  setIsResponseClosed,
  setResponseLimit,
  setQuestionsLocked,
  setQuestionsLockNote,
}: UseBuilderCollabBridgeParams): UseBuilderCollabBridgeResult {
  const {
    enabled: collabEnabled,
    connected: collabConnected,
    joined: collabJoined,
    participants: collabParticipants,
    latestSnapshotEvent,
    latestOpAppliedEvent,
    lastOpRejected,
    latestStatusEvent,
    version: collabVersion,
    sendPresenceUpdate,
    requestSync,
    sendOp,
  } = collab;

  const collabAppliedSnapshotSequenceRef = useRef<number>(0);
  const collabAppliedOpSequenceRef = useRef<number>(0);
  const suppressCollabOpBroadcastRef = useRef(false);
  const collabBroadcastTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const collabLastBroadcastPayloadKeyRef = useRef<string | null>(null);
  const collabLastConflictOpIdRef = useRef<string | null>(null);
  const collabSeenOpIdsRef = useRef<Set<string>>(new Set());
  const collabPendingLocalOpIdsRef = useRef<Set<string>>(new Set());

  const sendCollabIdlePresence = useCallback(() => {
    if (!collabEnabled || !collabConnected || !collabJoined) return;
    sendPresenceUpdate({ kind: "form", field: "builder" });
  }, [collabConnected, collabEnabled, collabJoined, sendPresenceUpdate]);

  const handleCollabFieldFocus = useCallback(
    (target: BuilderFieldTarget) => {
      if (!collabEnabled || !collabConnected || !collabJoined) return;
      sendPresenceUpdate(target);
    },
    [collabConnected, collabEnabled, collabJoined, sendPresenceUpdate],
  );

  const handleCollabFieldBlur = useCallback(() => {
    sendCollabIdlePresence();
  }, [sendCollabIdlePresence]);

  const getCollabEditorsLabel = useCallback(
    (target: BuilderFieldTarget) => {
      const editors = collabParticipants.filter((participant) => {
        if (participant.user.id === userId) return false;
        const editingTarget = participant.editingTarget;
        if (!editingTarget) return false;
        if (editingTarget.kind !== target.kind) return false;
        if ((editingTarget.id ?? undefined) !== (target.id ?? undefined)) return false;
        if ((editingTarget.field ?? undefined) !== (target.field ?? undefined)) return false;
        return true;
      });

      if (editors.length === 0) return null;
      const names = editors.map((participant) => participant.user.email).slice(0, 2);
      const suffix = editors.length > 2 ? ` +${editors.length - 2}` : "";
      return `${names.join(", ")}${suffix}`;
    },
    [collabParticipants, userId],
  );

  const applyRemoteBuilderSnapshot = useCallback(
    (
      source: "joined" | "sync" | "rest",
      remoteFormId: string,
      snapshot: BuilderSnapshot,
      version: number,
    ) => {
      const mappedSections = snapshot.sections
        .toSorted((a, b) => a.order - b.order)
        .map((section, index) => mapBuilderSnapshotSectionToEditor(section, index));
      const mappedQuestions = snapshot.questions
        .toSorted((a, b) => {
          const sectionOrderA =
            mappedSections.find((section) => section.id === a.sectionId)?.order ?? 0;
          const sectionOrderB =
            mappedSections.find((section) => section.id === b.sectionId)?.order ?? 0;
          if (sectionOrderA !== sectionOrderB) return sectionOrderA - sectionOrderB;
          return a.order - b.order;
        })
        .map((question, index) => mapBuilderSnapshotQuestionToEditor(question, index));

      suppressCollabOpBroadcastRef.current = true;
      setSnapshot({
        formId: remoteFormId,
        title: snapshot.title,
        description: snapshot.description ?? "",
        sections: mappedSections,
        questions: mappedQuestions,
        removedSectionIds: [],
        removedQuestionIds: [],
        hydrated: true,
      });
      setThankYouTitle(snapshot.thankYouTitle);
      setThankYouMessage(snapshot.thankYouMessage);
      setIsResponseClosed(Boolean(snapshot.isClosed));
      setResponseLimit(
        typeof snapshot.responseLimit === "number" ? String(snapshot.responseLimit) : "",
      );

      const nextSavedKey = createSavedSnapshotKey({
        title: snapshot.title,
        description: snapshot.description ?? "",
        thankYouTitle: snapshot.thankYouTitle,
        thankYouMessage: snapshot.thankYouMessage,
        isResponseClosed: Boolean(snapshot.isClosed),
        responseLimit:
          typeof snapshot.responseLimit === "number" ? String(snapshot.responseLimit) : "",
        sections: mappedSections,
        questions: mappedQuestions,
        removedSectionIds: [],
        removedQuestionIds: [],
      });
      lastSavedSnapshotKeyRef.current = nextSavedKey;
      collabLastBroadcastPayloadKeyRef.current = nextSavedKey;
      setHasUnsavedChanges(false);
      setSaveMessage(
        source === "joined"
          ? `Collab synced (v${version})`
          : source === "sync"
            ? `Collab resynced (v${version})`
            : `Collab snapshot refreshed (v${version})`,
      );

      globalThis.setTimeout(() => {
        suppressCollabOpBroadcastRef.current = false;
      }, 0);
      return nextSavedKey;
    },
    [
      lastSavedSnapshotKeyRef,
      setHasUnsavedChanges,
      setIsResponseClosed,
      setResponseLimit,
      setSaveMessage,
      setSnapshot,
      setThankYouMessage,
      setThankYouTitle,
    ],
  );

  const parseCollabPreviewReplacePayload = useCallback(
    (payload: unknown): CollabPreviewReplacePayload | null => {
      if (!payload || typeof payload !== "object") return null;
      const candidate = payload as Partial<CollabPreviewReplacePayload>;
      if (
        typeof candidate.title !== "string" ||
        typeof candidate.description !== "string" ||
        typeof candidate.thankYouTitle !== "string" ||
        typeof candidate.thankYouMessage !== "string" ||
        typeof candidate.isResponseClosed !== "boolean" ||
        typeof candidate.responseLimit !== "string" ||
        !Array.isArray(candidate.sections) ||
        !Array.isArray(candidate.questions)
      ) {
        return null;
      }

      const isValidSection = (value: unknown): value is EditorSection => {
        if (!value || typeof value !== "object") return false;
        const item = value as EditorSection;
        return (
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          typeof item.description === "string" &&
          typeof item.order === "number"
        );
      };
      const isValidQuestion = (value: unknown): value is EditorQuestion => {
        if (!value || typeof value !== "object") return false;
        const item = value as EditorQuestion;
        return (
          typeof item.id === "string" &&
          typeof item.sectionId === "string" &&
          typeof item.title === "string" &&
          typeof item.description === "string" &&
          typeof item.type === "string" &&
          typeof item.required === "boolean" &&
          typeof item.order === "number" &&
          Array.isArray(item.options) &&
          item.options.every((opt) => typeof opt === "string")
        );
      };

      if (
        !candidate.sections.every(isValidSection) ||
        !candidate.questions.every(isValidQuestion)
      ) {
        return null;
      }

      return {
        title: candidate.title,
        description: candidate.description,
        thankYouTitle: candidate.thankYouTitle,
        thankYouMessage: candidate.thankYouMessage,
        isResponseClosed: candidate.isResponseClosed,
        responseLimit: candidate.responseLimit,
        sections: candidate.sections.map((section) => ({ ...section })),
        questions: candidate.questions.map((question) => ({
          ...question,
          options: [...question.options],
        })),
      };
    },
    [],
  );

  const applyRemotePreviewReplacePayload = useCallback(
    (remoteFormId: string, payload: CollabPreviewReplacePayload, actorEmail?: string) => {
      suppressCollabOpBroadcastRef.current = true;
      setSnapshot({
        formId: remoteFormId,
        title: payload.title,
        description: payload.description,
        sections: payload.sections,
        questions: payload.questions,
        removedSectionIds: [],
        removedQuestionIds: [],
        hydrated: true,
      });
      setThankYouTitle(payload.thankYouTitle);
      setThankYouMessage(payload.thankYouMessage);
      setIsResponseClosed(payload.isResponseClosed);
      setResponseLimit(payload.responseLimit);

      const currentStore = useFormEditorStore.getState();
      const nextSavedKey = createSavedSnapshotKey({
        title: payload.title,
        description: payload.description,
        thankYouTitle: payload.thankYouTitle,
        thankYouMessage: payload.thankYouMessage,
        isResponseClosed: payload.isResponseClosed,
        responseLimit: payload.responseLimit,
        sections: currentStore.sections,
        questions: currentStore.questions,
        removedSectionIds: [],
        removedQuestionIds: [],
      });
      lastSavedSnapshotKeyRef.current = nextSavedKey;
      collabLastBroadcastPayloadKeyRef.current = nextSavedKey;
      setHasUnsavedChanges(false);
      setSaveMessage(actorEmail ? `Live preview from ${actorEmail}` : "Live collaboration preview");

      globalThis.setTimeout(() => {
        suppressCollabOpBroadcastRef.current = false;
      }, 0);
    },
    [
      lastSavedSnapshotKeyRef,
      setHasUnsavedChanges,
      setIsResponseClosed,
      setResponseLimit,
      setSaveMessage,
      setSnapshot,
      setThankYouMessage,
      setThankYouTitle,
    ],
  );

  useEffect(() => {
    const event = latestSnapshotEvent;
    if (!event) return;
    if (collabAppliedSnapshotSequenceRef.current >= event.sequence) return;
    collabAppliedSnapshotSequenceRef.current = event.sequence;

    const { payload, source } = event;
    if (!payload.snapshot) return;
    if (!hydrated || loading || error) return;
    if (publishing || savingDraft || savingRef.current) return;

    const localDirty =
      lastSavedSnapshotKeyRef.current !== null && lastSavedSnapshotKeyRef.current !== savePayloadKey;
    if (localDirty) {
      setSaveMessage(`Remote changes detected (v${payload.version}). Sync skipped due to local edits.`);
      return;
    }

    applyRemoteBuilderSnapshot(source, payload.formId, payload.snapshot, payload.version);
  }, [
    applyRemoteBuilderSnapshot,
    error,
    hydrated,
    latestSnapshotEvent,
    loading,
    publishing,
    savePayloadKey,
    savingDraft,
    savingRef,
    lastSavedSnapshotKeyRef,
    setSaveMessage,
  ]);

  useEffect(() => {
    const event = latestOpAppliedEvent;
    if (!event) return;
    if (collabAppliedOpSequenceRef.current >= event.sequence) return;

    const { payload } = event;
    if (collabSeenOpIdsRef.current.has(payload.opId)) return;
    collabSeenOpIdsRef.current.add(payload.opId);

    if (collabPendingLocalOpIdsRef.current.has(payload.opId)) {
      collabPendingLocalOpIdsRef.current.delete(payload.opId);
      collabAppliedOpSequenceRef.current = event.sequence;
      return;
    }

    if (payload.op.type !== "builder.preview.replace") return;
    if (!hydrated || loading || error) return;
    if (publishing || savingDraft) return;

    const parsed = parseCollabPreviewReplacePayload(payload.op.payload);
    if (!parsed) {
      setSaveMessage("Received invalid collaboration update payload.");
      collabAppliedOpSequenceRef.current = event.sequence;
      return;
    }

    applyRemotePreviewReplacePayload(payload.formId, parsed, payload.actor.email);
    collabAppliedOpSequenceRef.current = event.sequence;
  }, [
    applyRemotePreviewReplacePayload,
    error,
    hydrated,
    latestOpAppliedEvent,
    loading,
    parseCollabPreviewReplacePayload,
    publishing,
    savePayloadKey,
    savingDraft,
    savingRef,
    lastSavedSnapshotKeyRef,
    setSaveMessage,
  ]);

  useEffect(() => {
    if (!lastOpRejected) return;
    collabPendingLocalOpIdsRef.current.delete(lastOpRejected.opId);
    if (lastOpRejected.reason !== "BASE_VERSION_MISMATCH") return;
    if (collabLastConflictOpIdRef.current === lastOpRejected.opId) return;
    collabLastConflictOpIdRef.current = lastOpRejected.opId;
    setSaveMessage(`Version conflict detected (v${lastOpRejected.latestVersion}). Syncing...`);
    requestSync();
  }, [lastOpRejected, requestSync, setSaveMessage]);

  useEffect(() => {
    const event = latestStatusEvent;
    if (!event || !formId) return;
    if (event.payload.formId !== formId) return;

    if (event.payload.kind === "RESPONSES_LOCKED") {
      setQuestionsLocked(true);
      setQuestionsLockNote(event.payload.message);
      setSaveMessage(event.payload.message);
      requestSync();
      return;
    }

    if (event.payload.kind === "RESYNC_REQUIRED") {
      setSaveMessage(event.payload.message);
      requestSync();
    }
  }, [
    formId,
    latestStatusEvent,
    requestSync,
    setQuestionsLocked,
    setQuestionsLockNote,
    setSaveMessage,
  ]);

  useEffect(() => {
    if (!collabEnabled || !collabConnected || !collabJoined || !formId) return;
    sendCollabIdlePresence();
    return () => {
      sendPresenceUpdate(null);
    };
  }, [
    collabConnected,
    collabEnabled,
    collabJoined,
    formId,
    sendCollabIdlePresence,
    sendPresenceUpdate,
  ]);

  useEffect(() => {
    if (!enableRealtimeCollab) return;
    if (!collabConnected || !collabJoined || !formId) return;
    if (!hydrated || loading || error) return;
    if (collabVersion === null) return;
    if (lastSavedSnapshotKeyRef.current === null) return;
    if (suppressCollabOpBroadcastRef.current) return;
    if (savePayloadKey === lastSavedSnapshotKeyRef.current) return;
    if (collabLastBroadcastPayloadKeyRef.current === savePayloadKey) return;

    collabLastBroadcastPayloadKeyRef.current = savePayloadKey;
    if (collabBroadcastTimerRef.current !== null) {
      globalThis.clearTimeout(collabBroadcastTimerRef.current);
    }
    collabBroadcastTimerRef.current = globalThis.setTimeout(() => {
      collabBroadcastTimerRef.current = null;
      const opId = `op_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      collabPendingLocalOpIdsRef.current.add(opId);
      sendOp({
        formId,
        opId,
        baseVersion: collabVersion ?? 0,
        type: "builder.preview.replace",
        payload: {
          title: savePayload.title,
          description: savePayload.description,
          thankYouTitle: savePayload.thankYouTitle,
          thankYouMessage: savePayload.thankYouMessage,
          isResponseClosed: savePayload.isResponseClosed,
          responseLimit: savePayload.responseLimit,
          sections: savePayload.sections.map((section) => ({ ...section })),
          questions: savePayload.questions.map((question) => ({
            ...question,
            options: [...question.options],
          })),
        },
      });
    }, 200);

    return () => {
      if (collabBroadcastTimerRef.current !== null) {
        globalThis.clearTimeout(collabBroadcastTimerRef.current);
        collabBroadcastTimerRef.current = null;
      }
    };
  }, [
    collabConnected,
    collabJoined,
    collabVersion,
    enableRealtimeCollab,
    error,
    formId,
    hydrated,
    loading,
    savePayload,
    savePayloadKey,
    sendOp,
    lastSavedSnapshotKeyRef,
  ]);

  useEffect(() => {
    if (collabBroadcastTimerRef.current !== null) {
      globalThis.clearTimeout(collabBroadcastTimerRef.current);
      collabBroadcastTimerRef.current = null;
    }
    collabAppliedSnapshotSequenceRef.current = 0;
    collabAppliedOpSequenceRef.current = 0;
    collabLastBroadcastPayloadKeyRef.current = null;
    collabLastConflictOpIdRef.current = null;
    collabSeenOpIdsRef.current.clear();
    collabPendingLocalOpIdsRef.current.clear();
    suppressCollabOpBroadcastRef.current = false;
  }, [resetKey]);

  return {
    applyRemoteBuilderSnapshot,
    handleCollabFieldFocus,
    handleCollabFieldBlur,
    getCollabEditorsLabel,
  };
}
