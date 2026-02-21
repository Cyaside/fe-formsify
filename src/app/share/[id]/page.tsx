"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { apiRequest, ApiError } from "@/lib/api";

type QuestionType = "SHORT_ANSWER" | "MCQ" | "CHECKBOX" | "DROPDOWN";

type FormDetail = {
  id: string;
  title: string;
  description?: string | null;
  thankYouTitle?: string | null;
  thankYouMessage?: string | null;
};

type QuestionOption = { id: string; label: string; order: number };

type QuestionResponse = {
  id: string;
  title: string;
  description?: string | null;
  type: QuestionType;
  required: boolean;
  order: number;
  options: QuestionOption[];
};

type AnswerState = Record<string, unknown>;

type SubmitAnswer = { questionId: string; optionId?: string; text?: string };
const DEFAULT_THANK_YOU_TITLE = "Terima kasih!";
const DEFAULT_THANK_YOU_MESSAGE = "Respons kamu sudah terekam.";

const sortByOrder = <T extends { order: number }>(items: T[]) =>
  [...items].sort((a, b) => a.order - b.order);

const isRequiredMissing = (question: QuestionResponse, value: unknown) => {
  if (!question.required) return false;
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
};

const getValidationErrors = (questions: QuestionResponse[], answers: AnswerState) => {
  const nextErrors: Record<string, string> = {};
  questions.forEach((question) => {
    if (isRequiredMissing(question, answers[question.id])) {
      nextErrors[question.id] = "This question is required";
    }
  });
  return nextErrors;
};

const submitMessageClassName = (submitMessage: string) =>
  `text-sm ${submitMessage.includes("success") ? "text-lavender" : "text-rose"}`;

const buildSubmitAnswers = (questions: QuestionResponse[], answers: AnswerState): SubmitAnswer[] => {
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
  question: QuestionResponse;
  answer: unknown;
  onSetAnswer: (questionId: string, value: unknown) => void;
  onToggleCheckbox: (questionId: string, optionId: string) => void;
}>) {
  switch (question.type) {
    case "SHORT_ANSWER":
      return (
        <Input
          value={(answer as string) ?? ""}
          onChange={(event) => onSetAnswer(question.id, event.target.value)}
          placeholder="Your answer"
        />
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
                className="h-4 w-4"
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
                className="h-4 w-4"
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
  answers,
  validationErrors,
  submitting,
  submitMessage,
  onSubmit,
  onSetAnswer,
  onToggleCheckbox,
}: Readonly<{
  form: FormDetail | null;
  orderedQuestions: QuestionResponse[];
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
      <Card className="border-l-4 border-l-violet p-6">
        <h1 className="text-2xl font-semibold">{form.title}</h1>
        <p className="mt-2 text-sm text-ink-muted">{form.description || "No description"}</p>
        <p className="mt-4 text-xs text-ink-muted">* Required</p>
      </Card>

      {orderedQuestions.length === 0 ? (
        <Card className="text-sm text-ink-muted">This form has no questions yet.</Card>
      ) : (
        orderedQuestions.map((question, index) => (
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
        <div className="flex items-center justify-between">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
          {submitMessage ? <p className={submitMessageClassName(submitMessage)}>{submitMessage}</p> : null}
        </div>
      ) : null}
    </form>
  );
}

export default function SharedPublicFormPage() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const invalidFormId = !formId;

  const [form, setForm] = useState<FormDetail | null>(null);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(Boolean(formId));
  const [error, setError] = useState<string | null>(null);
  const [unpublished, setUnpublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!formId) return;
    setError(null);
    setUnpublished(false);

    Promise.all([
      apiRequest<{ data: FormDetail }>(`/api/forms/${formId}`),
      apiRequest<{ data: QuestionResponse[] }>(`/api/forms/${formId}/questions`),
    ])
      .then(([formResponse, questionResponse]) => {
        setForm(formResponse.data);
        setQuestions(sortByOrder(questionResponse.data));
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setUnpublished(true);
          setForm(null);
          setQuestions([]);
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

  const submitAnswers = async () => {
    await apiRequest(`/api/forms/${formId}/submit`, {
      method: "POST",
      body: {
        answers: buildSubmitAnswers(orderedQuestions, answers),
      },
      showGlobalLoading: true,
    });
  };

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formId || !validateAnswers()) return;

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

        {submitted && !unpublished ? (
          <Card className="space-y-3 border-l-4 border-l-lavender p-6 text-center">
            <h1 className="text-2xl font-semibold">{form?.thankYouTitle || DEFAULT_THANK_YOU_TITLE}</h1>
            <p className="text-sm text-ink-muted">{form?.thankYouMessage || DEFAULT_THANK_YOU_MESSAGE}</p>
          </Card>
        ) : !unpublished ? (
          <FillFormContent
            form={form}
            orderedQuestions={orderedQuestions}
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
