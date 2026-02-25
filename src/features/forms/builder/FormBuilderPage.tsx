"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useAuth } from "@/features/auth/AuthProvider";
import RequireAuth from "@/features/auth/RequireAuth";
import Container from "@/shared/ui/Container";
import Card from "@/shared/ui/Card";
import { ApiError } from "@/shared/api/client";
import { formsApi, type BuilderSnapshot } from "@/shared/api/forms";
import {
  clearDraft,
  saveDraft,
} from "@/features/forms/lib/formPersistence";
import {
  useFormEditorStore,
  type EditorSection,
  type EditorQuestion,
  type QuestionType,
} from "@/features/forms/store/formEditor";
import {
  DEFAULT_FORM_TITLE,
  DEFAULT_QUESTION_TITLE,
  mapUiTypeToApiType,
  requiresOptions,
} from "./lib/constants";
import BuilderCanvas from "./components/BuilderCanvas";
import BuilderFormMetaCard from "./components/BuilderFormMetaCard";
import BuilderToolbar from "./components/BuilderToolbar";
import {
  createDefaultQuestion,
  createDefaultSection,
  DEFAULT_THANK_YOU_MESSAGE,
  DEFAULT_THANK_YOU_TITLE,
  fromSortableId,
  getPublishValidationMessage,
  mapApiQuestionToEditor,
  mapApiSectionToEditor,
  mapBuilderSnapshotQuestionToEditor,
  mapBuilderSnapshotSectionToEditor,
  PUBLISH_NO_QUESTION_MESSAGE,
  QUESTION_SORTABLE_PREFIX,
  resolveBuilderActionErrorMessage,
  SECTION_SORTABLE_PREFIX,
} from "./lib/formBuilderShared";
import {
  createSavedSnapshotKey,
  performFormBuilderSave,
  type BuilderSaveSnapshot,
} from "./lib/formBuilderPersistence";
import { useFormBuilderBootstrap } from "./hooks/useFormBuilderBootstrap";
import { useUnsavedChangesNavigationGuard } from "./hooks/useUnsavedChangesNavigationGuard";
import { getBuilderCollabRolloutGuard } from "../collab/rollout";
import { useFormCollaboration } from "../collab/useFormCollaboration";

type FormBuilderPageProps = {
  initialFormId?: string;
};

export default function FormBuilderPage({ initialFormId }: Readonly<FormBuilderPageProps>) {
  const { user } = useAuth();
  const {
    formId,
    title,
    description,
    sections,
    questions,
    removedSectionIds,
    removedQuestionIds,
    hydrated,
    setFormId,
    setSnapshot,
    setFormMeta,
    setSections,
    addSection,
    duplicateSection,
    updateSection,
    moveSection,
    removeSection,
    replaceSectionId,
    addQuestion,
    updateQuestion,
    duplicateQuestion,
    removeQuestion,
    addOption,
    updateOption,
    removeOption,
    moveOption,
    setQuestions,
    clearRemovedSectionIds,
    clearRemovedQuestionIds,
    replaceQuestionId,
    reset,
  } = useFormEditorStore();
  const router = useRouter();

  const sensors = useSensors(useSensor(PointerSensor));
  const [saveMessage, setSaveMessage] = useState("Ready");
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lockedBaselineCaptured, setLockedBaselineCaptured] = useState(false);
  const [lockedSectionIds, setLockedSectionIds] = useState<string[]>([]);
  const [lockedQuestionIds, setLockedQuestionIds] = useState<string[]>([]);
  const lockedSectionIdSet = useMemo(() => new Set(lockedSectionIds), [lockedSectionIds]);
  const lockedQuestionIdSet = useMemo(() => new Set(lockedQuestionIds), [lockedQuestionIds]);

  const queueRef = useRef<null | {
    snapshot: {
      title: string;
      description: string;
      thankYouTitle: string;
      thankYouMessage: string;
      isResponseClosed: boolean;
      responseLimit: string;
      sections: EditorSection[];
      questions: EditorQuestion[];
      removedSectionIds: string[];
      removedQuestionIds: string[];
    };
    showGlobalLoading?: boolean;
  }>(null);
  const savingRef = useRef(false);
  const lastSavedSnapshotKeyRef = useRef<string | null>(null);
  const collabAppliedSnapshotSequenceRef = useRef<number>(0);
  const collabAppliedOpSequenceRef = useRef<number>(0);
  const suppressCollabOpBroadcastRef = useRef(false);
  const collabBroadcastTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const collabLastBroadcastPayloadKeyRef = useRef<string | null>(null);
  const collabLastConflictOpIdRef = useRef<string | null>(null);
  const collabSeenOpIdsRef = useRef<Set<string>>(new Set());
  const collabPendingLocalOpIdsRef = useRef<Set<string>>(new Set());

  const bootstrapDraftKey = initialFormId ?? "new";
  const {
    loading,
    error,
    thankYouTitle,
    thankYouMessage,
    isResponseClosed,
    isPublished,
    responseLimit,
    setThankYouTitle,
    setThankYouMessage,
    setIsResponseClosed,
    setResponseLimit,
    setIsPublished,
    questionsLocked,
    questionsLockNote,
    setQuestionsLocked,
    setQuestionsLockNote,
  } = useFormBuilderBootstrap({
    initialFormId,
    draftKey: bootstrapDraftKey,
    setSnapshot,
    reset,
  });
  const {
    collabFlagEnabled,
    enableRealtimeCollab,
    useLegacyBuilderFlow: shouldUseLegacyBuilderFlow,
  } =
    getBuilderCollabRolloutGuard();
  const collab = useFormCollaboration({
    enabled: enableRealtimeCollab && hydrated && !loading && !error && Boolean(formId),
    formId,
  });

  const sendCollabIdlePresence = useCallback(() => {
    if (!collab.enabled || !collab.connected || !collab.joined) return;
    collab.sendPresenceUpdate({ kind: "form", field: "builder" });
  }, [collab.connected, collab.enabled, collab.joined, collab.sendPresenceUpdate]);

  const handleCollabFieldFocus = useCallback(
    (target: { kind: "form" | "section" | "question" | "option"; id?: string; field?: string }) => {
      if (!collab.enabled || !collab.connected || !collab.joined) return;
      collab.sendPresenceUpdate(target);
    },
    [collab.connected, collab.enabled, collab.joined, collab.sendPresenceUpdate],
  );

  const handleCollabFieldBlur = useCallback(() => {
    sendCollabIdlePresence();
  }, [sendCollabIdlePresence]);

  const getCollabEditorsLabel = useCallback(
    (target: { kind: "form" | "section" | "question" | "option"; id?: string; field?: string }) => {
      const editors = collab.participants.filter((participant) => {
        if (participant.user.id === user?.id) return false;
        const editingTarget = participant.editingTarget;
        if (!editingTarget) return false;
        if (editingTarget.kind !== target.kind) return false;
        if ((editingTarget.id ?? undefined) !== (target.id ?? undefined)) return false;
        if ((editingTarget.field ?? undefined) !== (target.field ?? undefined)) return false;
        return true;
      });

      if (editors.length === 0) return null;
      const names = editors
        .map((participant) => participant.user.email)
        .slice(0, 2);
      const suffix = editors.length > 2 ? ` +${editors.length - 2}` : "";
      return `${names.join(", ")}${suffix}`;
    },
    [collab.participants, user?.id],
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
    [setIsResponseClosed, setResponseLimit, setSnapshot, setThankYouMessage, setThankYouTitle],
  );

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

  const parseCollabPreviewReplacePayload = useCallback((
    payload: unknown,
  ): CollabPreviewReplacePayload | null => {
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

    if (!candidate.sections.every(isValidSection) || !candidate.questions.every(isValidQuestion)) {
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
  }, []);

  const applyRemotePreviewReplacePayload = useCallback(
    (
      remoteFormId: string,
      payload: CollabPreviewReplacePayload,
      actorEmail?: string,
    ) => {
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
    [setIsResponseClosed, setResponseLimit, setSnapshot, setThankYouMessage, setThankYouTitle],
  );

  const performSave = useCallback(
    async (snapshot: BuilderSaveSnapshot, options?: { showGlobalLoading?: boolean }) => {
      const performVersionedSnapshotSave = async () => {
        const latestFormId = useFormEditorStore.getState().formId ?? formId;
        const activeDraftKey = initialFormId ?? latestFormId ?? "new";
        if (!latestFormId) {
          throw new ApiError(400, "Versioned snapshot save requires a persisted form");
        }
        if (collab.version === null) {
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
            baseVersion: collab.version,
            snapshot: builderSnapshotPayload,
          },
          { showGlobalLoading: options?.showGlobalLoading },
        );

        clearRemovedSectionIds();
        clearRemovedQuestionIds();
        clearDraft(activeDraftKey);
        collab.setKnownVersion(response.data.version);
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
        collab.connected &&
        collab.joined &&
        collab.role !== null &&
        collab.role !== "VIEWER" &&
        collab.version !== null &&
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
              collab.requestSync();
              return;
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
          : new Set(snapshot.sections.filter((section) => !section.id.startsWith("temp_")).map((section) => section.id)),
        lockedQuestionIds: lockedBaselineCaptured
          ? lockedQuestionIdSet
          : new Set(snapshot.questions.filter((question) => !question.id.startsWith("temp_")).map((question) => question.id)),
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
      clearRemovedQuestionIds,
      clearRemovedSectionIds,
      formId,
      hydrated,
      collab,
      enableRealtimeCollab,
      initialFormId,
      lockedBaselineCaptured,
      questionsLockNote,
      questionsLocked,
      lockedQuestionIdSet,
      lockedSectionIdSet,
      replaceQuestionId,
      replaceSectionId,
      setFormId,
      setHasUnsavedChanges,
    ],
  );

  const enqueueSave = useCallback(
    async (snapshot: {
      title: string;
      description: string;
      thankYouTitle: string;
      thankYouMessage: string;
      isResponseClosed: boolean;
      responseLimit: string;
      sections: EditorSection[];
      questions: EditorQuestion[];
      removedSectionIds: string[];
      removedQuestionIds: string[];
    }, options?: { showGlobalLoading?: boolean }) => {
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
    [formId, initialFormId, isPublished, performSave],
  );

  const savePayload = useMemo<BuilderSaveSnapshot>(
    () => ({
      title,
      description,
      thankYouTitle,
      thankYouMessage,
      isResponseClosed,
      responseLimit,
      sections,
      questions,
      removedSectionIds,
      removedQuestionIds,
    }),
    [
      title,
      description,
      thankYouTitle,
      thankYouMessage,
      isResponseClosed,
      responseLimit,
      sections,
      questions,
      removedSectionIds,
      removedQuestionIds,
    ],
  );

  const orderedSections = useMemo(
    () => sections.toSorted((a, b) => a.order - b.order),
    [sections],
  );
  const savePayloadKey = useMemo(() => createSavedSnapshotKey(savePayload), [savePayload]);

  useEffect(() => {
    const event = collab.latestSnapshotEvent;
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
    collab.latestSnapshotEvent,
    error,
    hydrated,
    loading,
    publishing,
    savePayloadKey,
    savingDraft,
  ]);

  useEffect(() => {
    const event = collab.latestOpAppliedEvent;
    if (!event) return;
    if (collabAppliedOpSequenceRef.current >= event.sequence) return;
    collabAppliedOpSequenceRef.current = event.sequence;

    const { payload } = event;
    if (collabSeenOpIdsRef.current.has(payload.opId)) return;
    collabSeenOpIdsRef.current.add(payload.opId);

    if (collabPendingLocalOpIdsRef.current.has(payload.opId)) {
      collabPendingLocalOpIdsRef.current.delete(payload.opId);
      return;
    }

    if (payload.op.type !== "builder.preview.replace") return;
    if (!hydrated || loading || error) return;
    if (publishing || savingDraft || savingRef.current) return;

    const localDirty =
      lastSavedSnapshotKeyRef.current !== null && lastSavedSnapshotKeyRef.current !== savePayloadKey;
    if (localDirty) {
      setSaveMessage(`Live update skipped due to local edits (${payload.actor.email}).`);
      return;
    }

    const parsed = parseCollabPreviewReplacePayload(payload.op.payload);
    if (!parsed) {
      setSaveMessage("Received invalid collaboration update payload.");
      return;
    }

    applyRemotePreviewReplacePayload(payload.formId, parsed, payload.actor.email);
  }, [
    applyRemotePreviewReplacePayload,
    collab.latestOpAppliedEvent,
    error,
    hydrated,
    loading,
    parseCollabPreviewReplacePayload,
    publishing,
    savePayloadKey,
    savingDraft,
  ]);

  useEffect(() => {
    if (!collab.lastOpRejected) return;
    collabPendingLocalOpIdsRef.current.delete(collab.lastOpRejected.opId);
    if (collab.lastOpRejected.reason !== "BASE_VERSION_MISMATCH") return;
    if (collabLastConflictOpIdRef.current === collab.lastOpRejected.opId) return;
    collabLastConflictOpIdRef.current = collab.lastOpRejected.opId;
    setSaveMessage(`Version conflict detected (v${collab.lastOpRejected.latestVersion}). Syncing...`);
    collab.requestSync();
  }, [collab.lastOpRejected, collab.requestSync]);

  useEffect(() => {
    if (!collab.enabled || !collab.connected || !collab.joined || !formId) return;
    sendCollabIdlePresence();
    return () => {
      collab.sendPresenceUpdate(null);
    };
  }, [collab.connected, collab.enabled, collab.joined, collab.sendPresenceUpdate, formId, sendCollabIdlePresence]);

  useEffect(() => {
    if (!enableRealtimeCollab) return;
    if (!collab.connected || !collab.joined || !formId) return;
    if (!hydrated || loading || error) return;
    if (collab.version === null) return;
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
      collab.sendOp({
        formId,
        opId,
        baseVersion: collab.version ?? 0,
        type: "builder.preview.replace",
        payload: {
          title,
          description,
          thankYouTitle,
          thankYouMessage,
          isResponseClosed,
          responseLimit,
          sections: sections.map((section) => ({ ...section })),
          questions: questions.map((question) => ({
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
    collab.connected,
    collab.joined,
    collab.sendOp,
    collab.version,
    enableRealtimeCollab,
    error,
    formId,
    hydrated,
    loading,
    savePayloadKey,
    title,
    description,
    thankYouTitle,
    thankYouMessage,
    isResponseClosed,
    responseLimit,
    sections,
    questions,
  ]);

  useEffect(() => {
    if (collabBroadcastTimerRef.current !== null) {
      globalThis.clearTimeout(collabBroadcastTimerRef.current);
      collabBroadcastTimerRef.current = null;
    }
    queueRef.current = null;
    savingRef.current = false;
    lastSavedSnapshotKeyRef.current = null;
    collabAppliedSnapshotSequenceRef.current = 0;
    collabAppliedOpSequenceRef.current = 0;
    collabLastBroadcastPayloadKeyRef.current = null;
    collabLastConflictOpIdRef.current = null;
    collabSeenOpIdsRef.current.clear();
    collabPendingLocalOpIdsRef.current.clear();
    suppressCollabOpBroadcastRef.current = false;
    setHasUnsavedChanges(false);
    setSaveMessage("Ready");
    setLockedBaselineCaptured(false);
    setLockedSectionIds([]);
    setLockedQuestionIds([]);
  }, [initialFormId]);

  useEffect(() => {
    if (!questionsLocked) {
      setLockedBaselineCaptured(false);
      setLockedSectionIds([]);
      setLockedQuestionIds([]);
      return;
    }
    if (lockedBaselineCaptured) return;
    if (!hydrated || loading || error) return;
    setLockedSectionIds(
      sections.filter((section) => !section.id.startsWith("temp_")).map((section) => section.id),
    );
    setLockedQuestionIds(
      questions.filter((question) => !question.id.startsWith("temp_")).map((question) => question.id),
    );
    setLockedBaselineCaptured(true);
  }, [error, hydrated, loading, lockedBaselineCaptured, questions, questionsLocked, sections]);

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

  useEffect(() => {
    if (!questionsLockNote) return;
    queueRef.current = null;
    setHasUnsavedChanges(false);
    setSaveMessage(questionsLockNote);
  }, [questionsLockNote]);

  useEffect(() => {
    if (!hydrated || loading || error) return;
    if (lastSavedSnapshotKeyRef.current === null) {
      lastSavedSnapshotKeyRef.current = savePayloadKey;
      setHasUnsavedChanges(false);
      return;
    }
    const isDirty = lastSavedSnapshotKeyRef.current !== savePayloadKey;
    setHasUnsavedChanges(isDirty);
    if (isDirty && !publishing && !savingDraft) {
      setSaveMessage(savingRef.current ? "Changes queued..." : "Unsaved changes");
    }
  }, [
    error,
    hydrated,
    loading,
    publishing,
    questionsLockNote,
    savePayloadKey,
    savingDraft,
  ]);

  useEffect(() => {
    if (!shouldUseLegacyBuilderFlow) return;
    if (!hydrated || loading || error) return;
    if (publishing || savingDraft) return;
    if (lastSavedSnapshotKeyRef.current === savePayloadKey) return;
    const timeout = globalThis.setTimeout(() => {
      void enqueueSave(savePayload, { showGlobalLoading: false });
    }, 500);
    return () => globalThis.clearTimeout(timeout);
  }, [
    enqueueSave,
    error,
    hydrated,
    loading,
    publishing,
    savePayload,
    savePayloadKey,
    savingDraft,
    shouldUseLegacyBuilderFlow,
  ]);

  useUnsavedChangesNavigationGuard({
    enabled: hasUnsavedChanges || savingRef.current || queueRef.current !== null,
  });

  const handleAddSection = () => {
    addSection(createDefaultSection(orderedSections.length));
  };

  const ensureSectionIdForQuestion = () => {
    if (orderedSections.length > 0) return orderedSections[0].id;
    const nextSection = createDefaultSection(0);
    addSection(nextSection);
    return nextSection.id;
  };

  const handleAddQuestionToSection = (
    sectionId: string,
    type: QuestionType = "SHORT_ANSWER",
  ) => {
    addQuestion(createDefaultQuestion(sectionId, type));
  };

  const handleAddQuestionFromToolbar = (type: QuestionType) => {
    const targetSectionId = ensureSectionIdForQuestion();
    handleAddQuestionToSection(targetSectionId, type);
  };

  const handleSectionUpdate = useCallback(
    (id: string, value: Partial<EditorSection>) => {
      if (isLockedSectionId(id)) return;
      updateSection(id, value);
    },
    [isLockedSectionId, updateSection],
  );

  const handleQuestionUpdate = useCallback(
    (id: string, value: Partial<EditorQuestion>) => {
      if (isLockedQuestionId(id)) return;
      if (value.sectionId) {
        const current = questions.find((question) => question.id === id);
        if (!current) return;
        if (value.sectionId !== current.sectionId) {
          const updated = { ...current, ...value };
          const remaining = questions.filter((question) => question.id !== id);
          setQuestions([...remaining, updated]);
          return;
        }
      }
      updateQuestion(id, value);
    },
    [isLockedQuestionId, questions, setQuestions, updateQuestion],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (questionsLocked) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeRawId = String(active.id);
    const overRawId = String(over.id);

    const activeSectionId = fromSortableId(activeRawId, SECTION_SORTABLE_PREFIX);
    const overSectionId = fromSortableId(overRawId, SECTION_SORTABLE_PREFIX);
    if (activeSectionId && overSectionId) {
      const oldIndex = orderedSections.findIndex((item) => item.id === activeSectionId);
      const newIndex = orderedSections.findIndex((item) => item.id === overSectionId);
      if (oldIndex < 0 || newIndex < 0) return;
      setSections(arrayMove(orderedSections, oldIndex, newIndex));
      return;
    }

    const activeQuestionId = fromSortableId(activeRawId, QUESTION_SORTABLE_PREFIX);
    const overQuestionId = fromSortableId(overRawId, QUESTION_SORTABLE_PREFIX);
    if (!activeQuestionId || !overQuestionId) return;

    const activeQuestion = questions.find((item) => item.id === activeQuestionId);
    const overQuestion = questions.find((item) => item.id === overQuestionId);
    if (!activeQuestion || !overQuestion) return;
    if (activeQuestion.sectionId !== overQuestion.sectionId) return;

    const sectionId = activeQuestion.sectionId;
    const sectionIndices = questions.reduce<number[]>((acc, question, index) => {
      if (question.sectionId === sectionId) acc.push(index);
      return acc;
    }, []);

    const sectionQuestions = sectionIndices.map((index) => questions[index]);
    const oldIndex = sectionQuestions.findIndex((item) => item.id === activeQuestionId);
    const newIndex = sectionQuestions.findIndex((item) => item.id === overQuestionId);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(sectionQuestions, oldIndex, newIndex).map(
      (question, index) => ({
        ...question,
        order: index,
      }),
    );
    const next = [...questions];
    sectionIndices.forEach((index, i) => {
      next[index] = reordered[i];
    });
    setQuestions(next);
  };

  const handlePublish = async () => {
    const publishValidationError = getPublishValidationMessage({
      title,
      sections,
      questions,
    });
    if (publishValidationError) {
      setSaveMessage(publishValidationError);
      return;
    }

    try {
      setPublishing(true);
      await enqueueSave(savePayload, { showGlobalLoading: true });
      const latestFormId = formId ?? useFormEditorStore.getState().formId;
      if (latestFormId) {
        await formsApi.update(
          latestFormId,
          { isPublished: true },
          { showGlobalLoading: true },
        );
      }
      setIsPublished(true);
      setSaveMessage(isResponseClosed ? "Closed" : "Published");
      router.push("/dashboard/forms");
    } catch (err) {
      setSaveMessage(resolveBuilderActionErrorMessage(err, "Failed to publish"));
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      await enqueueSave(savePayload, { showGlobalLoading: true });
      const latestFormId = formId ?? useFormEditorStore.getState().formId;
      if (latestFormId) {
        await formsApi.update(
          latestFormId,
          { isPublished: false, isClosed: false },
          { showGlobalLoading: true },
        );
      }
      setIsPublished(false);
      setIsResponseClosed(false);
      setSaveMessage("Draft saved");
      router.push("/dashboard/forms");
    } catch (err) {
      setSaveMessage(resolveBuilderActionErrorMessage(err, "Failed to save draft"));
    } finally {
      setSavingDraft(false);
    }
  };

  const content = (
    <BuilderCanvas
      loading={loading}
      error={error}
      orderedSections={orderedSections}
      questions={questions}
      questionsLocked={questionsLocked}
      isLockedSectionId={isLockedSectionId}
      isLockedQuestionId={isLockedQuestionId}
      sensors={sensors}
      onDragEnd={handleDragEnd}
      onAddSection={handleAddSection}
      onUpdateSection={handleSectionUpdate}
      onMoveSection={moveSection}
      onDuplicateSection={duplicateSection}
      onRemoveSection={removeSection}
      onAddQuestionToSection={(sectionId) => handleAddQuestionToSection(sectionId)}
      onQuestionUpdate={handleQuestionUpdate}
      onDuplicateQuestion={duplicateQuestion}
      onRemoveQuestion={removeQuestion}
      onAddOption={addOption}
      onUpdateOption={updateOption}
      onRemoveOption={removeOption}
      onMoveOption={moveOption}
      onFieldFocus={handleCollabFieldFocus}
      onFieldBlur={handleCollabFieldBlur}
      getEditorsLabel={getCollabEditorsLabel}
    />
  );

  return (
    <RequireAuth>
      <div className="min-h-screen bg-page text-ink">
        <Container className="max-w-4xl py-6 md:py-8">
          <BuilderFormMetaCard
            title={title}
            description={description}
            thankYouTitle={thankYouTitle}
            thankYouMessage={thankYouMessage}
            isResponseClosed={isResponseClosed}
            isPublished={isPublished}
            questionsLocked={questionsLocked}
            responseLimit={responseLimit}
            onChangeTitle={(value) => setFormMeta(value, description)}
            onChangeDescription={(value) => setFormMeta(title, value)}
            onChangeThankYouTitle={setThankYouTitle}
            onChangeThankYouMessage={setThankYouMessage}
            onChangeIsResponseClosed={setIsResponseClosed}
            onChangeResponseLimit={setResponseLimit}
            onFieldFocus={handleCollabFieldFocus}
            onFieldBlur={handleCollabFieldBlur}
            getEditorsLabel={getCollabEditorsLabel}
          />

          {questionsLockNote ? (
            <Card className="mb-4 border-rose/40 bg-rose/10 text-sm text-rose">
              {questionsLockNote}
            </Card>
          ) : null}

          {collabFlagEnabled ? (
            <Card className="mb-4 border-sky-500/30 bg-sky-500/5 text-sm text-ink">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-medium">Collab beta</span>
                <span className="text-ink-muted">
                  {collab.connecting
                    ? "Connecting..."
                    : collab.connected
                      ? collab.joined
                        ? "Connected"
                        : "Connected (joining room)"
                      : "Disconnected"}
                </span>
                <span className="text-ink-muted">
                  Participants: {collab.participants.length}
                </span>
                <span className="text-ink-muted">
                  Version: {collab.version ?? "-"}
                </span>
                {collab.role ? (
                  <span className="text-ink-muted">Role: {collab.role}</span>
                ) : null}
              </div>
              {collab.lastError ? (
                <p className="mt-2 text-xs text-rose">
                  {collab.lastError.code}: {collab.lastError.message}
                </p>
              ) : null}
            </Card>
          ) : null}

          <BuilderToolbar
            formId={formId}
            questionsLocked={questionsLocked}
            saveMessage={saveMessage}
            publishing={publishing}
            savingDraft={savingDraft}
            questionsCount={questions.length}
            publishNoQuestionMessage={PUBLISH_NO_QUESTION_MESSAGE}
            publishButtonLabel={isPublished ? "Update" : "Publish"}
            showSaveDraftButton={!isPublished}
            onAddSection={handleAddSection}
            onAddQuestionType={handleAddQuestionFromToolbar}
            onPublish={handlePublish}
            onSaveDraft={handleSaveDraft}
          />

          {content}
        </Container>
      </div>
    </RequireAuth>
  );
}
