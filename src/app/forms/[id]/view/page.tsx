"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { apiRequest, ApiError } from "@/lib/api";

type QuestionType = "SHORT_ANSWER" | "MCQ" | "CHECKBOX" | "DROPDOWN";

type FormDetail = {
  id: string;
  title: string;
  description?: string | null;
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

const sortByOrder = <T extends { order: number }>(items: T[]) => {
  return items.toSorted((a, b) => a.order - b.order);
};

export default function RespondentViewPage() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const invalidFormId = !formId;

  const [form, setForm] = useState<FormDetail | null>(null);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(Boolean(formId));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!formId) return;

    Promise.all([
      apiRequest<{ data: FormDetail }>(`/api/forms/${formId}`),
      apiRequest<{ data: QuestionResponse[] }>(`/api/forms/${formId}/questions`),
    ])
      .then(([formResponse, questionResponse]) => {
        setForm(formResponse.data);
        setQuestions(sortByOrder(questionResponse.data));
      })
      .catch((err) => {
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

  const isRequiredMissing = (question: QuestionResponse, value: unknown) => {
    if (!question.required) return false;
    return (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    );
  };

  const validateAnswers = () => {
    const nextErrors: Record<string, string> = {};
    orderedQuestions.forEach((question) => {
      if (isRequiredMissing(question, answers[question.id])) {
        nextErrors[question.id] = "This question is required";
      }
    });
    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitAnswers = async () => {
    await apiRequest(`/api/forms/${formId}/submit`, {
      method: "POST",
      body: {
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value,
        })),
      },
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
      setSubmitMessage("Response submitted successfully.");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to submit response";
      setSubmitMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (question: QuestionResponse) => {
    switch (question.type) {
      case "SHORT_ANSWER":
        return (
          <Input
            value={(answers[question.id] as string) ?? ""}
            onChange={(event) => setAnswer(question.id, event.target.value)}
            placeholder="Your answer"
          />
        );

      case "DROPDOWN":
        return (
          <Select
            value={(answers[question.id] as string) ?? ""}
            onChange={(event) => setAnswer(question.id, event.target.value)}
          >
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
                  checked={answers[question.id] === option.id}
                  onChange={() => setAnswer(question.id, option.id)}
                  className="h-4 w-4"
                />
                {option.label}
              </label>
            ))}
          </div>
        );

      case "CHECKBOX":
        return (
          <div className="space-y-2">
            {question.options.map((option) => {
              const selected = Array.isArray(answers[question.id])
                ? (answers[question.id] as string[])
                : [];

              return (
                <label key={option.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(option.id)}
                    onChange={() => toggleCheckboxAnswer(question.id, option.id)}
                    className="h-4 w-4"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-page py-8 text-ink">
      <Container className="max-w-3xl">
        {invalidFormId ? (
          <Card className="border-rose/40 bg-rose/10 text-sm text-rose">Invalid form ID</Card>
        ) : null}
        {loading ? <Card className="text-sm text-ink-muted">Loading form...</Card> : null}
        {error ? <Card className="border-rose/40 bg-rose/10 text-sm text-rose">{error}</Card> : null}

        {form ? (
          <form onSubmit={handleSubmit} className="space-y-4">
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

                  {renderQuestionInput(question)}

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
                {submitMessage ? (
                  <p
                    className={`text-sm ${
                      submitMessage.includes("success") ? "text-lavender" : "text-rose"
                    }`}
                  >
                    {submitMessage}
                  </p>
                ) : null}
              </div>
            ) : null}
          </form>
        ) : null}
      </Container>
    </div>
  );
}
