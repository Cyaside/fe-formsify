"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/shared/ui/Button";
import Card from "@/shared/ui/Card";
import Container from "@/shared/ui/Container";
import Input from "@/shared/ui/Input";
import Select from "@/shared/ui/Select";
import { ApiError } from "@/shared/api/client";
import {
  formsApi,
  type FormDetail,
  type Question,
  type Section,
  type SubmitAnswer,
} from "@/shared/api/forms";

type AnswerState = Record<string, unknown>;

type SectionPage = {
  section: Section | null;
  questions: Question[];
};

const DEFAULT_THANK_YOU_TITLE = "Thank you!";
const DEFAULT_THANK_YOU_MESSAGE = "Your response has been recorded.";
const TEXT_ANSWER_MAX_CHAR = 5000;

const sortByOrder = <T extends { order: number }>(items: T[]) =>
  [...items].sort((a, b) => a.order - b.order);

const isRequiredMissing = (question: Question, value: unknown) => {
  if (!question.required) return false;
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
};

const getValidationErrors = (questions: Question[], answers: AnswerState) => {
  const nextErrors: Record<string, string> = {};
  questions.forEach((question) => {
    if (isRequiredMissing(question, answers[question.id])) {
      nextErrors[question.id] = "This question is required";
    }
  });
  return nextErrors;
};

const submitMessageClassName = (submitMessage: string) =>
  `text-sm ${submitMessage.includes("success") ? "text-accent" : "text-rose"}`;

const buildSubmitAnswers = (questions: Question[], answers: AnswerState): SubmitAnswer[] => {
  return questions.flatMap<SubmitAnswer>((question) => {
    const value = answers[question.id];

    if (question.type === "SHORT_ANSWER") {
      const text = typeof value === "string" ? value.trim() : "";
      return text ? [{ questionId: question.id, text }] : [];
    }

    if (question.type === "CHECKBOX") {
      const optionIds = Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
        : [];
      return optionIds.map((optionId) => ({ questionId: question.id, optionId }));
    }

    const optionId = typeof value === "string" && value.length > 0 ? value : null;
    return optionId ? [{ questionId: question.id, optionId }] : [];
  });
};

function QuestionInputField({
  question,
  answer,
  onSetAnswer,
  onToggleCheckbox,
}: Readonly<{
  question: Question;
  answer: unknown;
  onSetAnswer: (questionId: string, value: unknown) => void;
  onToggleCheckbox: (questionId: string, optionId: string) => void;
}>) {
  switch (question.type) {
    case "SHORT_ANSWER":
      return (
        <div className="space-y-1">
          <Input
            value={(answer as string) ?? ""}
            onChange={(event) => onSetAnswer(question.id, event.target.value)}
            placeholder="Your answer"
            maxLength={TEXT_ANSWER_MAX_CHAR}
          />
          <p className="text-xs text-ink-muted">
            Short answer / paragraph: max {TEXT_ANSWER_MAX_CHAR.toLocaleString()} characters.
          </p>
        </div>
      );

    case "DROPDOWN":
      return (
        <Select value={(answer as string) ?? ""} onChange={(event) => onSetAnswer(question.id, event.target.value)}>
          <option value="">Select an option</option>
          {question.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
      );

    case "MCQ":
      return (
        <div className="space-y-2">
          {question.options.map((option) => (
            <label key={option.id} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={question.id}
                checked={answer === option.id}
                onChange={() => onSetAnswer(question.id, option.id)}
                className="h-4 w-4 accent-accent"
              />
              {option.label}
            </label>
          ))}
        </div>
      );

    case "CHECKBOX": {
      const selected = Array.isArray(answer) ? (answer as string[]) : [];

      return (
        <div className="space-y-2">
          {question.options.map((option) => (
            <label key={option.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(option.id)}
                onChange={() => onToggleCheckbox(question.id, option.id)}
                className="h-4 w-4 accent-accent"
              />
              {option.label}
            </label>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}

function FillFormContent({
  form,
  orderedQuestions,
  currentSection,
  currentPageQuestions,
  pageIndex,
  totalPages,
  onNextPage,
  onPrevPage,
  answers,
  validationErrors,
  submitting,
  submitMessage,
  onSubmit,
  onSetAnswer,
  onToggleCheckbox,
}: Readonly<{
  form: FormDetail | null;
  orderedQuestions: Question[];
  currentSection: Section | null;
  currentPageQuestions: Question[];
  pageIndex: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  answers: AnswerState;
  validationErrors: Record<string, string>;
  submitting: boolean;
  submitMessage: string | null;
  onSubmit: (event: React.SyntheticEvent<HTMLFormElement>) => Promise<void>;
  onSetAnswer: (questionId: string, value: unknown) => void;
  onToggleCheckbox: (questionId: string, optionId: string) => void;
}>) {
  if (!form) return null;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card className="border-l-4 border-l-accent p-6">
        <h1 className="text-2xl font-semibold">{form.title}</h1>
        <p className="mt-2 text-sm text-ink-muted">{form.description || "No description"}</p>
        <p className="mt-4 text-xs text-ink-muted">* Required</p>
      </Card>

      {currentSection ? (
        <Card className="space-y-2 border-dashed border-border/70 p-5">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>
              Section {pageIndex + 1} of {totalPages}
            </span>
            <span>{currentPageQuestions.length} questions</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">{currentSection.title}</h2>
            <p className="text-sm text-ink-muted">
              {currentSection.description || "No section description"}
            </p>
          </div>
        </Card>
      ) : null}

      {orderedQuestions.length === 0 ? (
        <Card className="text-sm text-ink-muted">This form has no questions yet.</Card>
      ) : (
        currentPageQuestions.map((question, index) => (
          <Card key={question.id} className="space-y-3 p-5">
            <div>
              <h2 className="text-base font-medium">
                {index + 1}. {question.title}
                {question.required ? <span className="ml-1 text-rose">*</span> : null}
              </h2>
              {question.description ? (
                <p className="mt-1 text-sm text-ink-muted">{question.description}</p>
              ) : null}
            </div>

            <QuestionInputField
              question={question}
              answer={answers[question.id]}
              onSetAnswer={onSetAnswer}
              onToggleCheckbox={onToggleCheckbox}
            />

            {validationErrors[question.id] ? (
              <p className="text-sm text-rose">{validationErrors[question.id]}</p>
            ) : null}
          </Card>
        ))
      )}

      {orderedQuestions.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>
              Section {pageIndex + 1} of {totalPages}
            </span>
            <span>{orderedQuestions.length} questions</span>
          </div>
          <div className="h-2 rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${((pageIndex + 1) / totalPages) * 100}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onPrevPage} disabled={pageIndex === 0}>
                Previous
              </Button>
              {pageIndex < totalPages - 1 ? (
                <Button type="button" onClick={onNextPage}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              )}
            </div>
            {submitMessage ? (
              <p className={submitMessageClassName(submitMessage)}>{submitMessage}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </form>
  );
}

export default function SharedPublicFormPage({
  initialFormId,
}: Readonly<{
  initialFormId?: string;
}>) {
  const actionCooldownMs = 350;
  const formId = initialFormId;
  const invalidFormId = !formId;

  const [form, setForm] = useState<FormDetail | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(Boolean(formId));
  const [error, setError] = useState<string | null>(null);
  const [unpublished, setUnpublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const lastActionAtRef = useRef(0);

  useEffect(() => {
    if (!formId) return;
    setError(null);
    setUnpublished(false);

    Promise.all([
      formsApi.detail(formId),
      formsApi.questions(formId),
      formsApi.sections(formId),
    ])
      .then(([formResponse, questionResponse, sectionsResponse]) => {
        setForm(formResponse.data);
        setQuestions(sortByOrder(questionResponse.data));
        setSections(sortByOrder(sectionsResponse.data));
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setUnpublished(true);
          setForm(null);
          setQuestions([]);
          setSections([]);
          return;
        }
        const message = err instanceof ApiError ? err.message : "Failed to load form";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [formId]);

  const orderedQuestions = useMemo(
    () => questions.map((question) => ({ ...question, options: sortByOrder(question.options) })),
    [questions],
  );

  const orderedSections = useMemo(() => sortByOrder(sections), [sections]);

  const pages = useMemo<SectionPage[]>(() => {
    if (orderedSections.length === 0) {
      return [{ section: null, questions: orderedQuestions }];
    }
    return orderedSections.map((section) => ({
      section,
      questions: orderedQuestions.filter((question) => question.sectionId === section.id),
    }));
  }, [orderedQuestions, orderedSections]);
  const totalPages = Math.max(1, pages.length);
  const currentPageIndex = Math.min(pageIndex, totalPages - 1);
  const currentPage = pages[currentPageIndex] ?? pages[0];
  const currentSection = currentPage?.section ?? null;
  const currentPageQuestions = currentPage?.questions ?? [];
  const isManuallyClosed = Boolean(form?.isClosed);
  const isResponseLimitReached =
    typeof form?.responseLimit === "number" &&
    typeof form?.responseCount === "number" &&
    form.responseCount >= form.responseLimit;
  const isResponseUnavailable = isManuallyClosed || isResponseLimitReached;

  const clearQuestionError = (questionId: string) => {
    setValidationErrors((prev) => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const setAnswer = (questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    clearQuestionError(questionId);
  };

  const toggleCheckboxAnswer = (questionId: string, optionId: string) => {
    const selected = Array.isArray(answers[questionId])
      ? (answers[questionId] as string[])
      : [];
    const next = selected.includes(optionId)
      ? selected.filter((item) => item !== optionId)
      : [...selected, optionId];
    setAnswer(questionId, next);
  };

  const validateAnswers = () => {
    const nextErrors = getValidationErrors(orderedQuestions, answers);
    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateCurrentPage = () => {
    const nextErrors = getValidationErrors(currentPageQuestions, answers);
    if (Object.keys(nextErrors).length === 0) return true;
    setValidationErrors((prev) => ({ ...prev, ...nextErrors }));
    return false;
  };

  const submitAnswers = async () => {
    await formsApi.submit(
      formId!,
      { answers: buildSubmitAnswers(orderedQuestions, answers) },
      { showGlobalLoading: true },
    );
  };

  const claimAction = () => {
    const now = Date.now();
    if (now - lastActionAtRef.current < actionCooldownMs) {
      return false;
    }
    lastActionAtRef.current = now;
    return true;
  };

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formId || submitting || isResponseUnavailable || !validateAnswers()) return;
    if (!claimAction()) return;

    setSubmitting(true);
    setSubmitMessage(null);
    try {
      await submitAnswers();
      setAnswers({});
      setSubmitted(true);
      setSubmitMessage("Response submitted successfully.");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to submit response";
      setSubmitMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-page py-8 text-ink">
      <Container className="max-w-3xl">
        {invalidFormId ? (
          <Card className="border-rose/40 bg-rose/10 text-sm text-rose">Invalid form ID</Card>
        ) : null}
        {loading ? <Card className="text-sm text-ink-muted">Loading form...</Card> : null}
        {unpublished ? (
          <Card className="border-rose/40 bg-rose/10 text-sm text-rose">
            Sorry the Forms you search isnt published yet
          </Card>
        ) : null}
        {error ? <Card className="border-rose/40 bg-rose/10 text-sm text-rose">{error}</Card> : null}
        {!loading && !error && !unpublished && isResponseUnavailable ? (
          <Card className="border-amber-300/50 bg-amber-100/40 text-sm text-amber-900">
            {isManuallyClosed
              ? "This form is closed and no longer accepts new responses."
              : `This form has reached its response limit (${form?.responseLimit}).`}
          </Card>
        ) : null}

        {submitted && !unpublished ? (
          <Card className="space-y-3 border-l-4 border-l-accent p-6 text-center">
            <h1 className="text-2xl font-semibold">{form?.thankYouTitle || DEFAULT_THANK_YOU_TITLE}</h1>
            <p className="text-sm text-ink-muted">{form?.thankYouMessage || DEFAULT_THANK_YOU_MESSAGE}</p>
          </Card>
        ) : !unpublished && !isResponseUnavailable ? (
          <FillFormContent
            form={form}
            orderedQuestions={orderedQuestions}
            currentSection={currentSection}
            currentPageQuestions={currentPageQuestions}
            pageIndex={currentPageIndex}
            totalPages={totalPages}
            onNextPage={() => {
              if (!validateCurrentPage()) return;
              if (!claimAction()) return;
              setPageIndex((prev) => Math.min(prev + 1, totalPages - 1));
            }}
            onPrevPage={() => {
              if (!claimAction()) return;
              setPageIndex((prev) => Math.max(prev - 1, 0));
            }}
            answers={answers}
            validationErrors={validationErrors}
            submitting={submitting}
            submitMessage={submitMessage}
            onSubmit={handleSubmit}
            onSetAnswer={setAnswer}
            onToggleCheckbox={toggleCheckboxAnswer}
          />
        ) : null}
      </Container>
    </div>
  );
}
