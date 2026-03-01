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
import { formsApi } from "@/shared/api/forms";
import {
  useFormEditorStore,
  type EditorSection,
  type EditorQuestion,
  type QuestionType,
} from "@/features/forms/store/formEditor";
import BuilderCanvas from "./components/BuilderCanvas";
import CollaboratorManagerCard from "./components/CollaboratorManagerCard";
import BuilderFormMetaCard from "./components/BuilderFormMetaCard";
import BuilderToolbar from "./components/BuilderToolbar";
import {
  createDefaultQuestion,
  createDefaultSection,
  fromSortableId,
  getPublishValidationMessage,
  PUBLISH_NO_QUESTION_MESSAGE,
  QUESTION_SORTABLE_PREFIX,
  resolveBuilderActionErrorMessage,
  SECTION_SORTABLE_PREFIX,
} from "./lib/formBuilderShared";
import {
  createSavedSnapshotKey,
  type BuilderSaveSnapshot,
} from "./lib/formBuilderPersistence";
import { useFormBuilderBootstrap } from "./hooks/useFormBuilderBootstrap";
import { useBuilderCollabBridge } from "./hooks/useBuilderCollabBridge";
import {
  useBuilderSaveQueue,
  type QueuedBuilderSaveRequest,
} from "./hooks/useBuilderSaveQueue";
import { useBuilderLockState } from "./hooks/useBuilderLockState";
import { useUnsavedChangesNavigationGuard } from "./hooks/useUnsavedChangesNavigationGuard";
import { getBuilderCollabRolloutGuard } from "../collab/rollout";
import { useFormCollaboration } from "../collab/useFormCollaboration";

type FormBuilderPageProps = {
  initialFormId?: string;
};

export default function FormBuilderPage({ initialFormId }: Readonly<FormBuilderPageProps>) {
  const { user, token } = useAuth();
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
  const queueRef = useRef<QueuedBuilderSaveRequest | null>(null);
  const savingRef = useRef(false);
  const lastSavedSnapshotKeyRef = useRef<string | null>(null);

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
    authToken: token,
  });
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

  const {
    applyRemoteBuilderSnapshot,
    handleCollabFieldFocus,
    handleCollabFieldBlur,
    getCollabEditorsLabel,
  } = useBuilderCollabBridge({
    collab,
    userId: user?.id,
    formId,
    resetKey: initialFormId,
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
  });
  const {
    lockedBaselineCaptured,
    lockedSectionIdSet,
    lockedQuestionIdSet,
    isLockedSectionId,
    isLockedQuestionId,
  } = useBuilderLockState({
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
  });

  const { enqueueSave } = useBuilderSaveQueue({
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
  });

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
    if (orderedSections.length > 0) return orderedSections[orderedSections.length - 1].id;
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

          <CollaboratorManagerCard
            enabled={collabFlagEnabled}
            formId={formId}
            role={collab.role}
          />

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
