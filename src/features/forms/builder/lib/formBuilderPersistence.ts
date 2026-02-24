import { ApiError } from "@/shared/api/client";
import { formsApi } from "@/shared/api/forms";
import { clearDraft } from "@/features/forms/lib/formPersistence";
import type { EditorQuestion, EditorSection } from "@/features/forms/store/formEditor";
import { DEFAULT_QUESTION_TITLE, mapUiTypeToApiType, requiresOptions } from "./constants";
import {
  DEFAULT_THANK_YOU_MESSAGE,
  DEFAULT_THANK_YOU_TITLE,
  QUESTION_LOCK_MESSAGE,
} from "./formBuilderShared";

export type BuilderSaveSnapshot = {
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

type BuilderSaveRequestOptions = {
  showGlobalLoading?: boolean;
};

type PerformFormBuilderSaveParams = {
  snapshot: BuilderSaveSnapshot;
  options?: BuilderSaveRequestOptions;
  hydrated: boolean;
  formId: string | null;
  draftKey: string;
  questionsLocked: boolean;
  lockedSectionIds: ReadonlySet<string>;
  lockedQuestionIds: ReadonlySet<string>;
  setSaveMessage: (value: string) => void;
  setFormId: (id: string | null) => void;
  setQuestionsLocked: (value: boolean) => void;
  setQuestionsLockNote: (value: string | null) => void;
  clearRemovedSectionIds: () => void;
  clearRemovedQuestionIds: () => void;
  replaceSectionId: (tempId: string, nextId: string) => void;
  replaceQuestionId: (tempId: string, nextId: string) => void;
};

const lockBuilder = (
  setQuestionsLocked: (value: boolean) => void,
  setQuestionsLockNote: (value: string | null) => void,
  setSaveMessage: (value: string) => void,
) => {
  setQuestionsLocked(true);
  setQuestionsLockNote(QUESTION_LOCK_MESSAGE);
  setSaveMessage(QUESTION_LOCK_MESSAGE);
};

export const createSavedSnapshotKey = (snapshot: BuilderSaveSnapshot) =>
  JSON.stringify({
    title: snapshot.title,
    description: snapshot.description,
    thankYouTitle: snapshot.thankYouTitle,
    thankYouMessage: snapshot.thankYouMessage,
    isResponseClosed: snapshot.isResponseClosed,
    responseLimit: snapshot.responseLimit,
    sections: snapshot.sections,
    questions: snapshot.questions,
    removedSectionIds: [],
    removedQuestionIds: [],
  });

export async function performFormBuilderSave({
  snapshot,
  options,
  hydrated,
  formId,
  draftKey,
  questionsLocked,
  lockedSectionIds,
  lockedQuestionIds,
  setSaveMessage,
  setFormId,
  setQuestionsLocked,
  setQuestionsLockNote,
  clearRemovedSectionIds,
  clearRemovedQuestionIds,
  replaceSectionId,
  replaceQuestionId,
}: PerformFormBuilderSaveParams): Promise<
  | { status: "skipped" }
  | { status: "saved"; savedSnapshotKey: string }
  | { status: "locked" }
> {
  if (!hydrated) return { status: "skipped" };
  if (!snapshot.title.trim()) return { status: "skipped" };

  const requestOptions = { showGlobalLoading: options?.showGlobalLoading };

  let activeFormId = formId;
  const isNewForm = !activeFormId;

  setSaveMessage("Saving changes...");

  const normalizedResponseLimitInput = snapshot.responseLimit.trim();
  const responseLimit =
    normalizedResponseLimitInput.length === 0
      ? null
      : Number.parseInt(normalizedResponseLimitInput, 10);

  if (!activeFormId) {
    const created = await formsApi.create(
      {
        title: snapshot.title.trim(),
        description: snapshot.description.trim() || null,
        thankYouTitle: snapshot.thankYouTitle.trim() || DEFAULT_THANK_YOU_TITLE,
        thankYouMessage: snapshot.thankYouMessage.trim() || DEFAULT_THANK_YOU_MESSAGE,
        isClosed: snapshot.isResponseClosed,
        responseLimit,
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
      isClosed: snapshot.isResponseClosed,
      responseLimit,
    },
    requestOptions,
  );

  if (questionsLocked) {
    if (!activeFormId) return { status: "skipped" };

    for (const questionId of snapshot.removedQuestionIds) {
      if (lockedQuestionIds.has(questionId)) continue;
      try {
        await formsApi.removeQuestion(questionId, requestOptions);
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          lockBuilder(setQuestionsLocked, setQuestionsLockNote, setSaveMessage);
          return { status: "locked" };
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
      for (const sectionId of snapshot.removedSectionIds) {
        if (lockedSectionIds.has(sectionId)) continue;
        await formsApi.removeSection(sectionId, requestOptions);
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
          continue;
        }

        if (lockedSectionIds.has(section.id)) continue;
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
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        lockBuilder(setQuestionsLocked, setQuestionsLockNote, setSaveMessage);
        return { status: "locked" };
      }
      throw err;
    }

    const orderCounter = new Map<string, number>();
    const normalizedQuestions = snapshot.questions.map((question) => {
      const resolvedSectionId = sectionIdMap.get(question.sectionId) ?? question.sectionId;
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
            ? question.options.map((item) => item.trim()).filter((item) => item.length > 0)
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
          continue;
        }

        if (lockedQuestionIds.has(question.id)) continue;
        await formsApi.updateQuestion(question.id, payload, requestOptions);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        lockBuilder(setQuestionsLocked, setQuestionsLockNote, setSaveMessage);
        return { status: "locked" };
      }
      throw err;
    }

    clearRemovedSectionIds();
    clearRemovedQuestionIds();
    clearDraft(draftKey);
    setSaveMessage("All changes saved");
    return {
      status: "saved",
      savedSnapshotKey: createSavedSnapshotKey(snapshot),
    };
  }

  for (const questionId of snapshot.removedQuestionIds) {
    try {
      await formsApi.removeQuestion(questionId, requestOptions);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        lockBuilder(setQuestionsLocked, setQuestionsLockNote, setSaveMessage);
        return { status: "locked" };
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
      const defaultSection = existingSections.data.toSorted((a, b) => a.order - b.order)[0];
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
            lockBuilder(setQuestionsLocked, setQuestionsLockNote, setSaveMessage);
            return { status: "locked" };
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
      lockBuilder(setQuestionsLocked, setQuestionsLockNote, setSaveMessage);
      return { status: "locked" };
    }
    throw err;
  }

  const orderCounter = new Map<string, number>();
  const normalizedQuestions = snapshot.questions.map((question) => {
    const resolvedSectionId = sectionIdMap.get(question.sectionId) ?? question.sectionId;
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
          ? question.options.map((item) => item.trim()).filter((item) => item.length > 0)
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
      lockBuilder(setQuestionsLocked, setQuestionsLockNote, setSaveMessage);
      return { status: "locked" };
    }
    throw err;
  }

  clearRemovedSectionIds();
  clearRemovedQuestionIds();
  clearDraft(draftKey);
  setSaveMessage("All changes saved");

  return {
    status: "saved",
    savedSnapshotKey: createSavedSnapshotKey(snapshot),
  };
}
