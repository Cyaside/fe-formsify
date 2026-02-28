import type { Question, ResponseAnswer, Section } from "@/shared/api/forms";

export type ResponseSectionPage = {
  key: string;
  title: string;
  description: string | null;
  answers: ResponseAnswer[];
  questionOrderById: Record<string, number>;
};

const sortByOrder = <T extends { order: number }>(items: T[]) =>
  items.toSorted((a, b) => a.order - b.order);

const buildQuestionOrderById = (questions: Question[]) =>
  questions.reduce<Record<string, number>>((acc, question, index) => {
    acc[question.id] = index;
    return acc;
  }, {});

const createFallbackPage = (
  answers: ResponseAnswer[],
  questions: Question[],
): ResponseSectionPage => ({
  key: "all",
  title: "All Questions",
  description: null,
  answers,
  questionOrderById: buildQuestionOrderById(sortByOrder(questions)),
});

export const buildResponseSectionPages = ({
  answers,
  sections,
  questions,
}: {
  answers: ResponseAnswer[];
  sections: Section[];
  questions: Question[];
}): ResponseSectionPage[] => {
  const orderedSections = sortByOrder(sections);
  const orderedQuestions = sortByOrder(questions);
  if (orderedSections.length === 0) {
    return [createFallbackPage(answers, orderedQuestions)];
  }

  const questionIdsBySection = orderedQuestions.reduce<Map<string, string[]>>((acc, question) => {
    const existing = acc.get(question.sectionId) ?? [];
    existing.push(question.id);
    acc.set(question.sectionId, existing);
    return acc;
  }, new Map<string, string[]>());

  const assignedQuestionIds = new Set<string>();
  const pages = orderedSections.map<ResponseSectionPage>((section) => {
    const questionIds = questionIdsBySection.get(section.id) ?? [];
    const questionIdSet = new Set(questionIds);
    questionIds.forEach((id) => assignedQuestionIds.add(id));

    return {
      key: section.id,
      title: section.title || "Untitled section",
      description: section.description ?? null,
      answers: answers.filter((answer) => questionIdSet.has(answer.questionId)),
      questionOrderById: questionIds.reduce<Record<string, number>>((acc, questionId, index) => {
        acc[questionId] = index;
        return acc;
      }, {}),
    };
  });

  const orphanAnswers = answers.filter((answer) => !assignedQuestionIds.has(answer.questionId));
  if (orphanAnswers.length > 0) {
    pages.push({
      key: "unknown",
      title: "Unknown Section",
      description: "Some answers reference questions that are no longer in current sections.",
      answers: orphanAnswers,
      questionOrderById: {},
    });
  }

  return pages.length > 0 ? pages : [createFallbackPage(answers, orderedQuestions)];
};

