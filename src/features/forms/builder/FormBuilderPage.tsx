"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, Loader2, Plus, Save, Send } from "lucide-react";
import RequireAuth from "@/features/auth/RequireAuth";
import Container from "@/shared/ui/Container";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import Textarea from "@/shared/ui/Textarea";
import ThemeToggle from "@/shared/theme/ThemeToggle";
import { ApiError } from "@/shared/api/client";
import { formsApi, type Question, type Section } from "@/shared/api/forms";
import {
  clearDraft,
  loadDraft,
  saveDraft,
} from "@/features/forms/lib/formPersistence";
import {
  useFormEditorStore,
  type EditorSection,
  type EditorQuestion,
  type QuestionType,
} from "@/features/forms/store/formEditor";
import QuestionCard from "./QuestionCard";
import {
  createTempId,
  DEFAULT_FORM_TITLE,
  DEFAULT_QUESTION_TITLE,
  DEFAULT_SECTION_TITLE,
  QUESTION_TYPE_OPTIONS,
  mapUiTypeToApiType,
  requiresOptions,
} from "./constants";

type QuestionResponse = Question;
type SectionResponse = Section;

type FormBuilderPageProps = {
  initialFormId?: string;
};

const DEFAULT_THANK_YOU_TITLE = "Terima kasih!";
const DEFAULT_THANK_YOU_MESSAGE = "Respons kamu sudah terekam.";
const QUESTION_LOCK_MESSAGE =
  "Sorry the forms already has submission you cant edit, create and delete the questions it anymore";

const mapOptionLabels = (options: QuestionResponse["options"]) => {
  return options.toSorted((a, b) => a.order - b.order).map((item) => item.label);
};

const mapApiSectionToEditor = (
  section: SectionResponse,
  index: number,
): EditorSection => {
  return {
    id: section.id,
    title: section.title,
    description: section.description ?? "",
    order: index,
  };
};

const mapApiQuestionToEditor = (
  question: QuestionResponse,
  index: number,
): EditorQuestion => {
  return {
    id: question.id,
    sectionId: question.sectionId,
    title: question.title,
    description: question.description ?? "",
    type: question.type,
    required: question.required,
    order: index,
    options: mapOptionLabels(question.options),
  };
};

function createDefaultSection(index: number): EditorSection {
  return {
    id: createTempId(),
    title: index === 0 ? DEFAULT_SECTION_TITLE : `Section ${index + 1}`,
    description: "",
    order: index,
  };
}

function createDefaultQuestion(
  sectionId: string,
  type: QuestionType = "SHORT_ANSWER",
): EditorQuestion {
  return {
    id: createTempId(),
    sectionId,
    title: DEFAULT_QUESTION_TITLE,
    description: "",
    type,
    required: false,
    order: 0,
    options: requiresOptions(type) ? ["Option 1"] : [],
  };
}

type SortableQuestionItemProps = Readonly<{
  index: number;
  question: EditorQuestion;
  sections: EditorSection[];
  onUpdate: (id: string, value: Partial<EditorQuestion>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onAddOption: (id: string) => void;
  onUpdateOption: (id: string, optionIndex: number, label: string) => void;
  onRemoveOption: (id: string, optionIndex: number) => void;
  onMoveOption: (id: string, fromIndex: number, toIndex: number) => void;
  readOnly?: boolean;
}>;

function SortableQuestionItem({
  index,
  question,
  sections,
  onUpdate,
  onDuplicate,
  onDelete,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onMoveOption,
  readOnly = false,
}: SortableQuestionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: question.id,
    disabled: readOnly,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <QuestionCard
        index={index}
        question={question}
        sections={sections}
        dragAttributes={attributes}
        dragListeners={listeners}
        onUpdate={onUpdate}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onAddOption={onAddOption}
        onUpdateOption={onUpdateOption}
        onRemoveOption={onRemoveOption}
        onMoveOption={onMoveOption}
        readOnly={readOnly}
      />
    </div>
  );
}

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
    addSection,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("Ready");
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [thankYouTitle, setThankYouTitle] = useState(DEFAULT_THANK_YOU_TITLE);
  const [thankYouMessage, setThankYouMessage] = useState(DEFAULT_THANK_YOU_MESSAGE);
  const [questionsLocked, setQuestionsLocked] = useState(false);
  const [questionsLockNote, setQuestionsLockNote] = useState<string | null>(null);

  const queueRef = useRef<null | {
    snapshot: {
      title: string;
      description: string;
      thankYouTitle: string;
      thankYouMessage: string;
      sections: EditorSection[];
      questions: EditorQuestion[];
      removedSectionIds: string[];
      removedQuestionIds: string[];
    };
    showGlobalLoading?: boolean;
  }>(null);
  const savingRef = useRef(false);

  const draftKey = initialFormId ?? "new";

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      setLoading(true);
      setError(null);
      setQuestionsLocked(false);
      setQuestionsLockNote(null);

      const localDraft = loadDraft(draftKey);
      if (localDraft) {
        const draftSections =
          localDraft.sections && localDraft.sections.length > 0
            ? localDraft.sections
            : [createDefaultSection(0)];
        const fallbackSectionId = draftSections[0].id;
        const draftQuestions = localDraft.questions.length > 0
          ? localDraft.questions.map((question) => ({
              ...question,
              sectionId: question.sectionId || fallbackSectionId,
            }))
          : [createDefaultQuestion(fallbackSectionId)];
        setThankYouTitle(localDraft.thankYouTitle ?? DEFAULT_THANK_YOU_TITLE);
        setThankYouMessage(localDraft.thankYouMessage ?? DEFAULT_THANK_YOU_MESSAGE);
        setSnapshot({
          formId: localDraft.formId,
          title: localDraft.title,
          description: localDraft.description,
          sections: draftSections,
          questions: draftQuestions,
          removedSectionIds: localDraft.removedSectionIds ?? [],
          removedQuestionIds: localDraft.removedQuestionIds ?? [],
          hydrated: true,
        });
        setLoading(false);
        return;
      }

      if (!initialFormId) {
        const initialSections = [createDefaultSection(0)];
        const initialQuestions = [createDefaultQuestion(initialSections[0].id)];
        setThankYouTitle(DEFAULT_THANK_YOU_TITLE);
        setThankYouMessage(DEFAULT_THANK_YOU_MESSAGE);
        setSnapshot({
          formId: null,
          title: DEFAULT_FORM_TITLE,
          description: "",
          sections: initialSections,
          questions: initialQuestions,
          removedSectionIds: [],
          removedQuestionIds: [],
          hydrated: true,
        });
        setLoading(false);
        return;
      }

      try {
        const [formResponse, questionsResponse, sectionsResponse] = await Promise.all([
          formsApi.detail(initialFormId),
          formsApi.questions(initialFormId),
          formsApi.sections(initialFormId),
        ]);
        if (!active) return;

        const sortedSections = sectionsResponse.data.toSorted(
          (a, b) => a.order - b.order,
        );
        const mappedSections: EditorSection[] = sortedSections.map(
          (section, index) => mapApiSectionToEditor(section, index),
        );
        const fallbackSection =
          mappedSections[0] ?? createDefaultSection(0);
        const fallbackSectionId = fallbackSection.id;

        const sectionOrderMap = new Map(
          mappedSections.map((section) => [section.id, section.order]),
        );
        const sortedQuestions = questionsResponse.data.toSorted((a, b) => {
          const sectionOrderA = sectionOrderMap.get(a.sectionId) ?? 0;
          const sectionOrderB = sectionOrderMap.get(b.sectionId) ?? 0;
          if (sectionOrderA !== sectionOrderB) return sectionOrderA - sectionOrderB;
          return a.order - b.order;
        });

        const mappedQuestions: EditorQuestion[] = sortedQuestions.map(
          (question, index) => ({
            ...mapApiQuestionToEditor(question, index),
            sectionId: question.sectionId || fallbackSectionId,
          }),
        );
        setThankYouTitle(formResponse.data.thankYouTitle || DEFAULT_THANK_YOU_TITLE);
        setThankYouMessage(formResponse.data.thankYouMessage || DEFAULT_THANK_YOU_MESSAGE);

        setSnapshot({
          formId: formResponse.data.id,
          title: formResponse.data.title,
          description: formResponse.data.description ?? "",
          sections:
            mappedSections.length > 0 ? mappedSections : [fallbackSection],
          questions:
            mappedQuestions.length > 0
              ? mappedQuestions
              : [createDefaultQuestion(fallbackSectionId)],
          removedSectionIds: [],
          removedQuestionIds: [],
          hydrated: true,
        });
      } catch (err) {
        if (!active) return;
        const message = err instanceof ApiError ? err.message : "Failed to load form";
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      active = false;
      reset();
    };
  }, [draftKey, initialFormId, reset, setSnapshot]);

  useEffect(() => {
    if (questionsLocked) {
      setAddMenuOpen(false);
    }
  }, [questionsLocked]);

  const performSave = useCallback(
    async (snapshot: {
      title: string;
      description: string;
      thankYouTitle: string;
      thankYouMessage: string;
      sections: EditorSection[];
      questions: EditorQuestion[];
      removedSectionIds: string[];
      removedQuestionIds: string[];
    }, options?: { showGlobalLoading?: boolean }) => {
      if (!hydrated) return;
      if (!snapshot.title.trim()) return;

      const requestOptions = { showGlobalLoading: options?.showGlobalLoading };

      let activeFormId = formId;
      const isNewForm = !activeFormId;

      setSaveMessage("Saving changes...");

      if (!activeFormId) {
        const created = await formsApi.create(
          {
            title: snapshot.title.trim(),
            description: snapshot.description.trim() || null,
            thankYouTitle: snapshot.thankYouTitle.trim() || DEFAULT_THANK_YOU_TITLE,
            thankYouMessage: snapshot.thankYouMessage.trim() || DEFAULT_THANK_YOU_MESSAGE,
            isPublished: false,
          },
          requestOptions,
        );
        activeFormId = created.data.id;
        setFormId(activeFormId);
      }

      await formsApi.update(
        activeFormId,
        {
          title: snapshot.title.trim(),
          description: snapshot.description.trim() || null,
          thankYouTitle: snapshot.thankYouTitle.trim() || DEFAULT_THANK_YOU_TITLE,
          thankYouMessage: snapshot.thankYouMessage.trim() || DEFAULT_THANK_YOU_MESSAGE,
        },
        requestOptions,
      );

      if (questionsLocked) {
        clearRemovedSectionIds();
        clearRemovedQuestionIds();
        clearDraft(draftKey);
        setSaveMessage(questionsLockNote ?? QUESTION_LOCK_MESSAGE);
        return;
      }

      for (const questionId of snapshot.removedQuestionIds) {
        try {
          await formsApi.removeQuestion(questionId, requestOptions);
        } catch (err) {
          if (err instanceof ApiError && err.status === 409) {
            setQuestionsLocked(true);
            setQuestionsLockNote(QUESTION_LOCK_MESSAGE);
            setSaveMessage(QUESTION_LOCK_MESSAGE);
            return;
          }
          throw err;
        }
      }

      const sectionIdMap = new Map<string, string>();
      const normalizedSections = snapshot.sections.map((section, index) => ({
        ...section,
        title: section.title.trim() || `Section ${index + 1}`,
        description: section.description.trim() || null,
        order: index,
      }));

      try {
        if (isNewForm) {
          const existingSections = await formsApi.sections(activeFormId);
          const defaultSection = existingSections.data.toSorted(
            (a, b) => a.order - b.order,
          )[0];
          if (defaultSection && normalizedSections[0]) {
            const firstSection = normalizedSections[0];
            sectionIdMap.set(firstSection.id, defaultSection.id);
            replaceSectionId(firstSection.id, defaultSection.id);
            await formsApi.updateSection(
              defaultSection.id,
              {
                title: firstSection.title,
                description: firstSection.description,
                order: 0,
              },
              requestOptions,
            );

            for (const section of normalizedSections.slice(1)) {
              if (section.id.startsWith("temp_")) {
                const createdSection = await formsApi.createSection(
                  activeFormId,
                  {
                    title: section.title,
                    description: section.description,
                    order: section.order,
                  },
                  requestOptions,
                );
                sectionIdMap.set(section.id, createdSection.data.id);
                replaceSectionId(section.id, createdSection.data.id);
              } else {
                await formsApi.updateSection(
                  section.id,
                  {
                    title: section.title,
                    description: section.description,
                    order: section.order,
                  },
                  requestOptions,
                );
              }
            }
          } else {
            for (const section of normalizedSections) {
              if (section.id.startsWith("temp_")) {
                const createdSection = await formsApi.createSection(
                  activeFormId,
                  {
                    title: section.title,
                    description: section.description,
                    order: section.order,
                  },
                  requestOptions,
                );
                sectionIdMap.set(section.id, createdSection.data.id);
                replaceSectionId(section.id, createdSection.data.id);
              } else {
                await formsApi.updateSection(
                  section.id,
                  {
                    title: section.title,
                    description: section.description,
                    order: section.order,
                  },
                  requestOptions,
                );
              }
            }
          }
        } else {
          for (const sectionId of snapshot.removedSectionIds) {
            try {
              await formsApi.removeSection(sectionId, requestOptions);
            } catch (err) {
              if (err instanceof ApiError && err.status === 409) {
                setQuestionsLocked(true);
                setQuestionsLockNote(QUESTION_LOCK_MESSAGE);
                setSaveMessage(QUESTION_LOCK_MESSAGE);
                return;
              }
              throw err;
            }
          }

          for (const section of normalizedSections) {
            if (section.id.startsWith("temp_")) {
              const createdSection = await formsApi.createSection(
                activeFormId,
                {
                  title: section.title,
                  description: section.description,
                  order: section.order,
                },
                requestOptions,
              );
              sectionIdMap.set(section.id, createdSection.data.id);
              replaceSectionId(section.id, createdSection.data.id);
            } else {
              await formsApi.updateSection(
                section.id,
                {
                  title: section.title,
                  description: section.description,
                  order: section.order,
                },
                requestOptions,
              );
            }
          }
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          setQuestionsLocked(true);
          setQuestionsLockNote(QUESTION_LOCK_MESSAGE);
          setSaveMessage(QUESTION_LOCK_MESSAGE);
          return;
        }
        throw err;
      }

      const orderCounter = new Map<string, number>();
      const normalizedQuestions = snapshot.questions.map((question) => {
        const resolvedSectionId =
          sectionIdMap.get(question.sectionId) ?? question.sectionId;
        const nextOrder = orderCounter.get(resolvedSectionId) ?? 0;
        orderCounter.set(resolvedSectionId, nextOrder + 1);
        return {
          ...question,
          sectionId: resolvedSectionId,
          order: nextOrder,
        };
      });

      try {
        for (const question of normalizedQuestions) {
          const payload = {
            title: question.title.trim() || DEFAULT_QUESTION_TITLE,
            description: question.description.trim() || null,
            type: mapUiTypeToApiType(question.type),
            required: question.required,
            order: question.order,
            sectionId: question.sectionId,
            options: requiresOptions(question.type)
              ? question.options
                  .map((item) => item.trim())
                  .filter((item) => item.length > 0)
              : [],
          };

          if (requiresOptions(question.type) && payload.options.length === 0) {
            payload.options = ["Option 1"];
          }

          if (question.id.startsWith("temp_")) {
            const createdQuestion = await formsApi.createQuestion(
              activeFormId,
              payload,
              requestOptions,
            );
            replaceQuestionId(question.id, createdQuestion.data.id);
          } else {
            await formsApi.updateQuestion(question.id, payload, requestOptions);
          }
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          setQuestionsLocked(true);
          setQuestionsLockNote(QUESTION_LOCK_MESSAGE);
          setSaveMessage(QUESTION_LOCK_MESSAGE);
          return;
        }
        throw err;
      }

      clearRemovedSectionIds();
      clearRemovedQuestionIds();
      clearDraft(draftKey);

      setSaveMessage("All changes saved");
    },
    [
      clearRemovedQuestionIds,
      clearRemovedSectionIds,
      draftKey,
      formId,
      hydrated,
      questionsLockNote,
      questionsLocked,
      replaceQuestionId,
      replaceSectionId,
      setFormId,
    ],
  );

  const enqueueSave = useCallback(
    async (snapshot: {
      title: string;
      description: string;
      thankYouTitle: string;
      thankYouMessage: string;
      sections: EditorSection[];
      questions: EditorQuestion[];
      removedSectionIds: string[];
      removedQuestionIds: string[];
    }, options?: { showGlobalLoading?: boolean }) => {
      saveDraft(draftKey, {
        formId,
        title: snapshot.title,
        description: snapshot.description,
        thankYouTitle: snapshot.thankYouTitle,
        thankYouMessage: snapshot.thankYouMessage,
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
    [draftKey, formId, performSave],
  );

  const savePayload = useMemo(
    () => ({
      title,
      description,
      thankYouTitle,
      thankYouMessage,
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

  useEffect(() => {
    if (!hydrated || loading || error) return;
    const timeout = globalThis.setTimeout(() => {
      void enqueueSave(savePayload, { showGlobalLoading: false });
    }, 500);
    return () => globalThis.clearTimeout(timeout);
  }, [enqueueSave, error, hydrated, loading, savePayload]);

  const handleAddSection = () => {
    if (questionsLocked) return;
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
    if (questionsLocked) return;
    addQuestion(createDefaultQuestion(sectionId, type));
  };

  const handleQuestionUpdate = useCallback(
    (id: string, value: Partial<EditorQuestion>) => {
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
    [questions, setQuestions, updateQuestion],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (questionsLocked) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeQuestion = questions.find((item) => item.id === active.id);
    const overQuestion = questions.find((item) => item.id === over.id);
    if (!activeQuestion || !overQuestion) return;
    if (activeQuestion.sectionId !== overQuestion.sectionId) return;

    const sectionId = activeQuestion.sectionId;
    const sectionIndices = questions.reduce<number[]>((acc, question, index) => {
      if (question.sectionId === sectionId) acc.push(index);
      return acc;
    }, []);

    const sectionQuestions = sectionIndices.map((index) => questions[index]);
    const oldIndex = sectionQuestions.findIndex((item) => item.id === active.id);
    const newIndex = sectionQuestions.findIndex((item) => item.id === over.id);
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
      setSaveMessage("Published");
      router.push("/dashboard/forms");
    } catch {
      setSaveMessage("Failed to publish");
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
          { isPublished: false },
          { showGlobalLoading: true },
        );
      }
      setSaveMessage("Draft saved");
      router.push("/dashboard/forms");
    } catch {
      setSaveMessage("Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  const content = (() => {
    if (loading) {
      return <Card className="text-sm text-ink-muted">Loading form builder...</Card>;
    }
    if (error) {
      return <Card className="border-rose/40 bg-rose/10 text-sm text-rose">{error}</Card>;
    }

    if (orderedSections.length === 0) {
      return (
        <Card className="space-y-3 text-sm text-ink-muted">
          <p>No sections yet.</p>
          <Button variant="secondary" onClick={handleAddSection} disabled={questionsLocked}>
            Add Section
          </Button>
        </Card>
      );
    }

    return (
      <div className="space-y-6 pb-14">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {orderedSections.map((section, sectionIndex) => {
            const sectionQuestions = questions.filter(
              (question) => question.sectionId === section.id,
            );
            const canDeleteSection =
              !questionsLocked &&
              orderedSections.length > 1 &&
              sectionQuestions.length === 0;

            return (
              <div key={section.id} className="space-y-3">
                <Card className="border-t-4 border-t-lavender/70 p-4 md:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Input
                        value={section.title}
                        onChange={(event) =>
                          updateSection(section.id, { title: event.target.value })
                        }
                        placeholder={`Section ${sectionIndex + 1}`}
                        disabled={questionsLocked}
                      />
                      <Textarea
                        value={section.description}
                        onChange={(event) =>
                          updateSection(section.id, { description: event.target.value })
                        }
                        placeholder="Section description (optional)"
                        className="min-h-[68px]"
                        disabled={questionsLocked}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSection(section.id, -1)}
                        disabled={questionsLocked || sectionIndex === 0}
                      >
                        Move up
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveSection(section.id, 1)}
                        disabled={questionsLocked || sectionIndex === orderedSections.length - 1}
                      >
                        Move down
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAddQuestionToSection(section.id)}
                        disabled={questionsLocked}
                      >
                        Add question
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeSection(section.id)}
                        disabled={!canDeleteSection}
                      >
                        Delete section
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-ink-muted">
                    Section {sectionIndex + 1} of {orderedSections.length}
                  </p>
                </Card>

                {sectionQuestions.length === 0 ? (
                  <Card className="text-sm text-ink-muted">
                    No questions in this section yet.
                  </Card>
                ) : (
                  <SortableContext
                    items={sectionQuestions.map((question) => question.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {sectionQuestions.map((question, index) => (
                      <SortableQuestionItem
                        key={question.id}
                        index={index}
                        question={question}
                        sections={orderedSections}
                        onUpdate={handleQuestionUpdate}
                        onDuplicate={duplicateQuestion}
                        onDelete={removeQuestion}
                        onAddOption={(id) => addOption(id)}
                        onUpdateOption={updateOption}
                        onRemoveOption={removeOption}
                        onMoveOption={moveOption}
                        readOnly={questionsLocked}
                      />
                    ))}
                  </SortableContext>
                )}
              </div>
            );
          })}
        </DndContext>
      </div>
    );
  })();

  return (
    <RequireAuth>
      <div className="min-h-screen bg-page text-ink">
        <Container className="max-w-4xl py-6 md:py-8">
          <Card className="mb-4 border-t-4 border-t-lavender p-6">
            <div className="space-y-3">
              <Input
                value={title}
                onChange={(event) => setFormMeta(event.target.value, description)}
                className="h-12 border-none bg-transparent px-0 text-3xl font-semibold shadow-none focus:border-none"
                placeholder="Form title"
              />
              <Textarea
                value={description}
                onChange={(event) => setFormMeta(title, event.target.value)}
                className="min-h-20 resize-none border-none bg-transparent px-0 py-0 text-sm text-ink-muted shadow-none focus:border-none"
                placeholder="Form description"
              />
              <div className="grid gap-3 border-t border-border/60 pt-3 md:grid-cols-2">
                <Input
                  value={thankYouTitle}
                  onChange={(event) => setThankYouTitle(event.target.value)}
                  placeholder="Thank you title"
                />
                <Textarea
                  value={thankYouMessage}
                  onChange={(event) => setThankYouMessage(event.target.value)}
                  className="min-h-11 resize-none"
                  placeholder="Thank you message"
                />
              </div>
            </div>
          </Card>

          {questionsLockNote ? (
            <Card className="mb-4 border-rose/40 bg-rose/10 text-sm text-rose">
              {questionsLockNote}
            </Card>
          ) : null}

          <nav className="sticky top-3 z-20 mb-4 rounded-2xl border border-border bg-surface/90 p-3 shadow-[0_14px_32px_rgba(8,6,20,0.2)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative">
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={handleAddSection}
                    disabled={questionsLocked}
                  >
                    <Plus size={16} />
                    Add Section
                  </Button>
                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={() => {
                      if (questionsLocked) return;
                      setAddMenuOpen((prev) => !prev);
                    }}
                    disabled={questionsLocked}
                  >
                    <Plus size={16} />
                    Add Question
                  </Button>
                </div>
                {addMenuOpen ? (
                  <div className="absolute left-0 top-12 z-30 w-52 rounded-xl border border-border bg-surface p-2">
                    {QUESTION_TYPE_OPTIONS.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          if (questionsLocked) return;
                          const targetSectionId = ensureSectionIdForQuestion();
                          handleAddQuestionToSection(targetSectionId, type.value);
                          setAddMenuOpen(false);
                        }}
                        className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-ink-muted transition hover:bg-surface-2 hover:text-ink"
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-4">
                {formId ? (
                  <Link href={`/forms/${formId}/view?returnTo=builder`}>
                    <Button variant="secondary" className="gap-2">
                      <Eye size={16} />
                      Preview
                    </Button>
                  </Link>
                ) : (
                  <Button variant="secondary" className="gap-2" disabled>
                    <Eye size={16} />
                    Preview
                  </Button>
                )}

                <div className="text-center">
                  <p className="text-sm font-semibold">Formsify Builder</p>
                  <p className="text-xs text-ink-muted">{saveMessage}</p>
                </div>

                <Button className="gap-2" onClick={handlePublish} disabled={publishing}>
                  <Send size={16} />
                  {publishing ? "Publishing..." : "Publish"}
                </Button>

                <Button
                  variant="secondary"
                  className="gap-2"
                  onClick={handleSaveDraft}
                  disabled={savingDraft}
                >
                  {savingDraft ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {savingDraft ? "Saving..." : "Save Draft"}
                </Button>

                <ThemeToggle />
              </div>
            </div>
          </nav>

          {content}
        </Container>
      </div>
    </RequireAuth>
  );
}
