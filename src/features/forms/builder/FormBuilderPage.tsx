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
import RequireAuth from "@/features/auth/RequireAuth";
import Container from "@/shared/ui/Container";
import Card from "@/shared/ui/Card";
import { ApiError } from "@/shared/api/client";
import { formsApi } from "@/shared/api/forms";
import {
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

type FormBuilderPageProps = {
  initialFormId?: string;
};

export default function FormBuilderPage({ initialFormId }: Readonly<FormBuilderPageProps>) {
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

  const performSave = useCallback(
    async (snapshot: BuilderSaveSnapshot, options?: { showGlobalLoading?: boolean }) => {
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
    queueRef.current = null;
    savingRef.current = false;
    lastSavedSnapshotKeyRef.current = null;
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
          />

          {questionsLockNote ? (
            <Card className="mb-4 border-rose/40 bg-rose/10 text-sm text-rose">
              {questionsLockNote}
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
