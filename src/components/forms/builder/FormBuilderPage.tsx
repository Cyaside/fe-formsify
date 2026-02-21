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
import { Eye, Loader2, Plus, Save, Send, XCircle } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { apiRequest, ApiError } from "@/lib/api";
import {
  clearDraft,
  loadDraft,
  saveDraft,
} from "@/lib/formPersistence";
import {
  useFormEditorStore,
  type EditorQuestion,
  type QuestionType,
} from "@/store/formEditor";
import QuestionCard from "./QuestionCard";
import {
  createTempId,
  DEFAULT_FORM_TITLE,
  DEFAULT_QUESTION_TITLE,
  QUESTION_TYPE_OPTIONS,
  mapUiTypeToApiType,
  requiresOptions,
} from "./constants";

type FormDetail = {
  id: string;
  title: string;
  description?: string | null;
  thankYouTitle: string;
  thankYouMessage: string;
};

type QuestionResponse = {
  id: string;
  title: string;
  description?: string | null;
  type: "SHORT_ANSWER" | "MCQ" | "CHECKBOX" | "DROPDOWN";
  required: boolean;
  order: number;
  options: { id: string; label: string; order: number }[];
};

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

const mapApiQuestionToEditor = (
  question: QuestionResponse,
  index: number,
): EditorQuestion => {
  return {
    id: question.id,
    title: question.title,
    description: question.description ?? "",
    type: question.type,
    required: question.required,
    order: index,
    options: mapOptionLabels(question.options),
  };
};

function createDefaultQuestion(type: QuestionType = "SHORT_ANSWER"): EditorQuestion {
  return {
    id: createTempId(),
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
    questions,
    removedQuestionIds,
    hydrated,
    setFormId,
    setSnapshot,
    setFormMeta,
    addQuestion,
    updateQuestion,
    duplicateQuestion,
    removeQuestion,
    addOption,
    updateOption,
    removeOption,
    moveOption,
    setQuestions,
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
      questions: EditorQuestion[];
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
        setThankYouTitle(localDraft.thankYouTitle ?? DEFAULT_THANK_YOU_TITLE);
        setThankYouMessage(localDraft.thankYouMessage ?? DEFAULT_THANK_YOU_MESSAGE);
        setSnapshot({ ...localDraft, hydrated: true });
        setLoading(false);
        return;
      }

      if (!initialFormId) {
        setThankYouTitle(DEFAULT_THANK_YOU_TITLE);
        setThankYouMessage(DEFAULT_THANK_YOU_MESSAGE);
        setSnapshot({
          formId: null,
          title: DEFAULT_FORM_TITLE,
          description: "",
          questions: [createDefaultQuestion()],
          removedQuestionIds: [],
          hydrated: true,
        });
        setLoading(false);
        return;
      }

      try {
        const [formResponse, questionsResponse] = await Promise.all([
          apiRequest<{ data: FormDetail }>(`/api/forms/${initialFormId}`),
          apiRequest<{ data: QuestionResponse[] }>(`/api/forms/${initialFormId}/questions`),
        ]);
        if (!active) return;

        const sortedQuestions = questionsResponse.data.toSorted(
          (a, b) => a.order - b.order,
        );

        const mappedQuestions: EditorQuestion[] = sortedQuestions.map(
          (question, index) => mapApiQuestionToEditor(question, index),
        );
        setThankYouTitle(formResponse.data.thankYouTitle || DEFAULT_THANK_YOU_TITLE);
        setThankYouMessage(formResponse.data.thankYouMessage || DEFAULT_THANK_YOU_MESSAGE);

        setSnapshot({
          formId: formResponse.data.id,
          title: formResponse.data.title,
          description: formResponse.data.description ?? "",
          questions: mappedQuestions.length > 0 ? mappedQuestions : [createDefaultQuestion()],
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
      questions: EditorQuestion[];
      removedQuestionIds: string[];
    }, options?: { showGlobalLoading?: boolean }) => {
      if (!hydrated) return;
      if (!snapshot.title.trim()) return;

      const requestOptions = { showGlobalLoading: options?.showGlobalLoading };

      let activeFormId = formId;

      setSaveMessage("Saving changes...");

      if (!activeFormId) {
        const created = await apiRequest<{ data: { id: string } }>("/api/forms", {
          method: "POST",
          body: {
            title: snapshot.title.trim(),
            description: snapshot.description.trim() || null,
            thankYouTitle: snapshot.thankYouTitle.trim() || DEFAULT_THANK_YOU_TITLE,
            thankYouMessage: snapshot.thankYouMessage.trim() || DEFAULT_THANK_YOU_MESSAGE,
            isPublished: false,
          },
          ...requestOptions,
        });
        activeFormId = created.data.id;
        setFormId(activeFormId);
      }

      await apiRequest(`/api/forms/${activeFormId}`, {
        method: "PUT",
        body: {
          title: snapshot.title.trim(),
          description: snapshot.description.trim() || null,
          thankYouTitle: snapshot.thankYouTitle.trim() || DEFAULT_THANK_YOU_TITLE,
          thankYouMessage: snapshot.thankYouMessage.trim() || DEFAULT_THANK_YOU_MESSAGE,
        },
        ...requestOptions,
      });

      if (questionsLocked) {
        clearRemovedQuestionIds();
        clearDraft(draftKey);
        setSaveMessage(questionsLockNote ?? QUESTION_LOCK_MESSAGE);
        return;
      }

      for (const questionId of snapshot.removedQuestionIds) {
        try {
          await apiRequest(`/api/questions/${questionId}`, {
            method: "DELETE",
            ...requestOptions,
          });
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

      const normalizedQuestions = snapshot.questions.map((question, index) => ({
        ...question,
        order: index,
      }));

      try {
        for (const question of normalizedQuestions) {
          const payload = {
            title: question.title.trim() || DEFAULT_QUESTION_TITLE,
            description: question.description.trim() || null,
            type: mapUiTypeToApiType(question.type),
            required: question.required,
            order: question.order,
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
            const createdQuestion = await apiRequest<{ data: { id: string } }>(
              `/api/forms/${activeFormId}/questions`,
              {
                method: "POST",
                body: payload,
                ...requestOptions,
              },
            );
            replaceQuestionId(question.id, createdQuestion.data.id);
          } else {
            await apiRequest(`/api/questions/${question.id}`, {
              method: "PUT",
              body: payload,
              ...requestOptions,
            });
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

      clearRemovedQuestionIds();
      clearDraft(draftKey);

      setSaveMessage("All changes saved");
    },
    [
      clearRemovedQuestionIds,
      draftKey,
      formId,
      hydrated,
      questionsLockNote,
      questionsLocked,
      replaceQuestionId,
      setFormId,
    ],
  );

  const enqueueSave = useCallback(
    async (snapshot: {
      title: string;
      description: string;
      thankYouTitle: string;
      thankYouMessage: string;
      questions: EditorQuestion[];
      removedQuestionIds: string[];
    }, options?: { showGlobalLoading?: boolean }) => {
      saveDraft(draftKey, {
        formId,
        title: snapshot.title,
        description: snapshot.description,
        thankYouTitle: snapshot.thankYouTitle,
        thankYouMessage: snapshot.thankYouMessage,
        questions: snapshot.questions,
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
      questions,
      removedQuestionIds,
    }),
    [title, description, thankYouTitle, thankYouMessage, questions, removedQuestionIds],
  );

  useEffect(() => {
    if (!hydrated || loading || error) return;
    const timeout = globalThis.setTimeout(() => {
      void enqueueSave(savePayload, { showGlobalLoading: false });
    }, 500);
    return () => globalThis.clearTimeout(timeout);
  }, [enqueueSave, error, hydrated, loading, savePayload]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (questionsLocked) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((item) => item.id === active.id);
    const newIndex = questions.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(questions, oldIndex, newIndex).map((question, index) => ({
      ...question,
      order: index,
    }));
    setQuestions(next);
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      await enqueueSave(savePayload, { showGlobalLoading: true });
      const latestFormId = formId ?? useFormEditorStore.getState().formId;
      if (latestFormId) {
        await apiRequest(`/api/forms/${latestFormId}`, {
          method: "PUT",
          body: { isPublished: true },
          showGlobalLoading: true,
        });
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
        await apiRequest(`/api/forms/${latestFormId}`, {
          method: "PUT",
          body: { isPublished: false },
          showGlobalLoading: true,
        });
      }
      setSaveMessage("Draft saved");
      router.push("/dashboard/forms");
    } catch {
      setSaveMessage("Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleCancelDraft = () => {
    clearDraft(draftKey);
    router.push("/dashboard/forms");
  };

  const content = (() => {
    if (loading) {
      return <Card className="text-sm text-ink-muted">Loading form builder...</Card>;
    }
    if (error) {
      return <Card className="border-rose/40 bg-rose/10 text-sm text-rose">{error}</Card>;
    }

    return (
      <div className="space-y-4 pb-14">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={questions.map((question) => question.id)}
            strategy={verticalListSortingStrategy}
          >
            {questions.map((question, index) => (
              <SortableQuestionItem
                key={question.id}
                index={index}
                question={question}
                onUpdate={updateQuestion}
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
                {addMenuOpen ? (
                  <div className="absolute left-0 top-12 z-30 w-52 rounded-xl border border-border bg-surface p-2">
                    {QUESTION_TYPE_OPTIONS.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          if (questionsLocked) return;
                          addQuestion(createDefaultQuestion(type.value));
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

                <Button variant="ghost" className="gap-2" onClick={handleCancelDraft}>
                  <XCircle size={16} />
                  Cancel Draft
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
