"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import RequireAuth from "@/components/auth/RequireAuth";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import { apiRequest, ApiError } from "@/lib/api";
import {
  clearDraft,
  loadDraft,
  saveDraft,
  setFormStatus,
} from "@/lib/formPersistence";
import {
  useFormEditorStore,
  type EditorQuestion,
  type QuestionType,
} from "@/store/formEditor";
import BuilderHeader from "./BuilderHeader";
import FloatingAddQuestion from "./FloatingAddQuestion";
import QuestionCard from "./QuestionCard";
import {
  createTempId,
  DEFAULT_FORM_TITLE,
  DEFAULT_QUESTION_TITLE,
  mapUiTypeToApiType,
  requiresOptions,
} from "./constants";

type FormDetail = {
  id: string;
  title: string;
  description?: string | null;
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

type SaveState = "idle" | "saving" | "saved" | "error";

type FormBuilderPageProps = {
  initialFormId?: string;
};

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
}: SortableQuestionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: question.id,
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

  const sensors = useSensors(useSensor(PointerSensor));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = useState("Ready");
  const [publishing, setPublishing] = useState(false);

  const queueRef = useRef<null | {
    title: string;
    description: string;
    questions: EditorQuestion[];
    removedQuestionIds: string[];
  }>(null);
  const savingRef = useRef(false);

  const draftKey = initialFormId ?? "new";

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      setLoading(true);
      setError(null);

      const localDraft = loadDraft(draftKey);
      if (localDraft) {
        setSnapshot({ ...localDraft, hydrated: true });
        setLoading(false);
        return;
      }

      if (!initialFormId) {
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

  const performSave = useCallback(
    async (snapshot: {
      title: string;
      description: string;
      questions: EditorQuestion[];
      removedQuestionIds: string[];
    }) => {
      if (!hydrated) return;
      if (!snapshot.title.trim()) return;

      let activeFormId = formId;

      setSaveState("saving");
      setSaveMessage("Saving changes...");

      if (!activeFormId) {
        const created = await apiRequest<{ data: { id: string } }>("/api/forms", {
          method: "POST",
          body: {
            title: snapshot.title.trim(),
            description: snapshot.description.trim() || null,
          },
        });
        activeFormId = created.data.id;
        setFormId(activeFormId);
        setFormStatus(activeFormId, "draft");
      }

      await apiRequest(`/api/forms/${activeFormId}`, {
        method: "PUT",
        body: {
          title: snapshot.title.trim(),
          description: snapshot.description.trim() || null,
        },
      });

      for (const questionId of snapshot.removedQuestionIds) {
        await apiRequest(`/api/questions/${questionId}`, { method: "DELETE" });
      }

      const normalizedQuestions = snapshot.questions.map((question, index) => ({
        ...question,
        order: index,
      }));

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
            },
          );
          replaceQuestionId(question.id, createdQuestion.data.id);
        } else {
          await apiRequest(`/api/questions/${question.id}`, {
            method: "PUT",
            body: payload,
          });
        }
      }

      clearRemovedQuestionIds();
      clearDraft(draftKey);

      setSaveState("saved");
      setSaveMessage("All changes saved");
    },
    [
      clearRemovedQuestionIds,
      draftKey,
      formId,
      hydrated,
      replaceQuestionId,
      setFormId,
    ],
  );

  const enqueueSave = useCallback(
    async (snapshot: {
      title: string;
      description: string;
      questions: EditorQuestion[];
      removedQuestionIds: string[];
    }) => {
      saveDraft(draftKey, {
        formId,
        title: snapshot.title,
        description: snapshot.description,
        questions: snapshot.questions,
        removedQuestionIds: snapshot.removedQuestionIds,
      });

      if (savingRef.current) {
        queueRef.current = snapshot;
        return;
      }

      savingRef.current = true;
      try {
        await performSave(snapshot);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Failed to autosave";
        setSaveState("error");
        setSaveMessage(message);
      } finally {
        savingRef.current = false;
      }

      if (queueRef.current) {
        const queued = queueRef.current;
        queueRef.current = null;
        await enqueueSave(queued);
      }
    },
    [draftKey, formId, performSave],
  );

  const savePayload = useMemo(
    () => ({
      title,
      description,
      questions,
      removedQuestionIds,
    }),
    [title, description, questions, removedQuestionIds],
  );

  useEffect(() => {
    if (!hydrated || loading || error) return;
    const timeout = globalThis.setTimeout(() => {
      void enqueueSave(savePayload);
    }, 500);
    return () => globalThis.clearTimeout(timeout);
  }, [enqueueSave, error, hydrated, loading, savePayload]);

  const handleDragEnd = (event: DragEndEvent) => {
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
      await enqueueSave(savePayload);
      if (formId) {
        setFormStatus(formId, "published");
      }
      setSaveState("saved");
      setSaveMessage("Published");
    } catch {
      setSaveState("error");
      setSaveMessage("Failed to publish");
    } finally {
      setPublishing(false);
    }
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
        <BuilderHeader
          title={title}
          description={description}
          saveState={saveState}
          saveMessage={saveMessage}
          canPreview={Boolean(formId)}
          previewHref={formId ? `/forms/${formId}/view` : "#"}
          onChangeTitle={(value) => setFormMeta(value, description)}
          onChangeDescription={(value) => setFormMeta(title, value)}
          onPublish={handlePublish}
          publishing={publishing}
        />

        <Container className="max-w-4xl py-6 md:py-8">{content}</Container>

        <FloatingAddQuestion
          onAdd={(type) => {
            addQuestion(createDefaultQuestion(type));
          }}
        />
      </div>
    </RequireAuth>
  );
}
