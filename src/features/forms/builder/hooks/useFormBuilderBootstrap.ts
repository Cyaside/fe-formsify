"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/shared/api/client";
import { formsApi } from "@/shared/api/forms";
import { loadDraft } from "@/features/forms/lib/formPersistence";
import type { EditorQuestion, EditorSection } from "@/features/forms/store/formEditor";
import { DEFAULT_FORM_TITLE } from "../lib/constants";
import {
  createDefaultQuestion,
  createDefaultSection,
  DEFAULT_THANK_YOU_MESSAGE,
  DEFAULT_THANK_YOU_TITLE,
  mapApiQuestionToEditor,
  mapApiSectionToEditor,
} from "../lib/formBuilderShared";

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

type UseFormBuilderBootstrapParams = {
  initialFormId?: string;
  draftKey: string;
  setSnapshot: SnapshotSetter;
  reset: () => void;
};

export function useFormBuilderBootstrap({
  initialFormId,
  draftKey,
  setSnapshot,
  reset,
}: UseFormBuilderBootstrapParams) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thankYouTitle, setThankYouTitle] = useState(DEFAULT_THANK_YOU_TITLE);
  const [thankYouMessage, setThankYouMessage] = useState(DEFAULT_THANK_YOU_MESSAGE);
  const [questionsLocked, setQuestionsLocked] = useState(false);
  const [questionsLockNote, setQuestionsLockNote] = useState<string | null>(null);

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
        const draftQuestions =
          localDraft.questions.length > 0
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

        const sortedSections = sectionsResponse.data.toSorted((a, b) => a.order - b.order);
        const mappedSections: EditorSection[] = sortedSections.map((section, index) =>
          mapApiSectionToEditor(section, index),
        );
        const fallbackSection = mappedSections[0] ?? createDefaultSection(0);
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

        const mappedQuestions: EditorQuestion[] = sortedQuestions.map((question, index) => ({
          ...mapApiQuestionToEditor(question, index),
          sectionId: question.sectionId || fallbackSectionId,
        }));

        setThankYouTitle(formResponse.data.thankYouTitle || DEFAULT_THANK_YOU_TITLE);
        setThankYouMessage(formResponse.data.thankYouMessage || DEFAULT_THANK_YOU_MESSAGE);

        setSnapshot({
          formId: formResponse.data.id,
          title: formResponse.data.title,
          description: formResponse.data.description ?? "",
          sections: mappedSections.length > 0 ? mappedSections : [fallbackSection],
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

  return {
    loading,
    error,
    thankYouTitle,
    thankYouMessage,
    setThankYouTitle,
    setThankYouMessage,
    questionsLocked,
    questionsLockNote,
    setQuestionsLocked,
    setQuestionsLockNote,
  };
}
