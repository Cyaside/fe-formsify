"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import { apiRequest, ApiError } from "@/lib/api";

type QuestionType = "SHORT_ANSWER" | "MCQ" | "CHECKBOX" | "DROPDOWN";

type FormOwnerDetail = {
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

type ResponseRecord = {
  id: string;
  formId: string;
  createdAt: string;
  answers: Array<{
    id: string;
    questionId: string;
    optionId?: string | null;
    text?: string | null;
    question: {
      id: string;
      title: string;
      type: QuestionType;
      options: Array<{ id: string; label: string }>;
    };
  }>;
};

type ResponsesPayload = {
  data: ResponseRecord[];
  form: FormOwnerDetail;
};

type OptionSummary = {
  optionId: string;
  label: string;
  count: number;
  percent: number;
};

type QuestionSummary = {
  questionId: string;
  title: string;
  type: QuestionType;
  responseCount: number;
  options: OptionSummary[];
};

const formatPercent = (value: number) => `${Math.round(value)}%`;

export default function FormSummaryPage() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [form, setForm] = useState<FormOwnerDetail | null>(null);
  const [responses, setResponses] = useState<ResponseRecord[]>([]);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(Boolean(formId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!formId) return;

    Promise.all([
      apiRequest<ResponsesPayload>(`/api/forms/${formId}/responses`),
      apiRequest<{ data: QuestionResponse[] }>(`/api/forms/${formId}/questions`),
    ])
      .then(([responsesPayload, questionsPayload]) => {
        setForm(responsesPayload.form);
        setResponses(responsesPayload.data);
        setQuestions(questionsPayload.data.toSorted((a, b) => a.order - b.order));
      })
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Failed to load summary";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [formId]);

  const questionSummaries = useMemo<QuestionSummary[]>(() => {
    return questions
      .filter((question) => question.type !== "SHORT_ANSWER")
      .map((question) => {
        const optionCounts = new Map<string, number>();
        question.options.forEach((option) => optionCounts.set(option.id, 0));

        responses.forEach((response) => {
          response.answers
            .filter((answer) => answer.questionId === question.id && answer.optionId)
            .forEach((answer) => {
              const optionId = answer.optionId as string;
              optionCounts.set(optionId, (optionCounts.get(optionId) ?? 0) + 1);
            });
        });

        const totalSelections = Array.from(optionCounts.values()).reduce((sum, value) => sum + value, 0);

        const options = question.options
          .toSorted((a, b) => a.order - b.order)
          .map((option) => {
            const count = optionCounts.get(option.id) ?? 0;
            return {
              optionId: option.id,
              label: option.label,
              count,
              percent: totalSelections > 0 ? (count / totalSelections) * 100 : 0,
            };
          });

        return {
          questionId: question.id,
          title: question.title,
          type: question.type,
          responseCount: totalSelections,
          options,
        };
      });
  }, [questions, responses]);

  const shortAnswerSummary = useMemo(() => {
    return questions
      .filter((question) => question.type === "SHORT_ANSWER")
      .map((question) => {
        const entries = responses
          .flatMap((response) => response.answers)
          .filter((answer) => answer.questionId === question.id)
          .map((answer) => answer.text?.trim())
          .filter((text): text is string => Boolean(text));

        return {
          questionId: question.id,
          title: question.title,
          entries,
        };
      });
  }, [questions, responses]);

  return (
    <div className="min-h-screen bg-page py-8 text-ink">
      <Container className="max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/forms">
            <Button variant="secondary">Back to Forms</Button>
          </Link>
          <div className="flex items-center gap-2">
            {formId ? (
              <>
                <Link href={`/forms/${formId}/view`}>
                  <Button variant="ghost" size="sm">Form</Button>
                </Link>
                <Link href={`/forms/${formId}/responses`}>
                  <Button variant="ghost" size="sm">Responses</Button>
                </Link>
                <Button size="sm">Summary</Button>
              </>
            ) : null}
          </div>
        </div>

        {loading ? <Card className="text-sm text-ink-muted">Loading summary...</Card> : null}
        {error ? <Card className="border-rose/40 bg-rose/10 text-sm text-rose">{error}</Card> : null}

        {form ? (
          <Card className="space-y-2 border-l-4 border-l-lavender p-6">
            <h1 className="text-2xl font-semibold">{form.title}</h1>
            <p className="text-sm text-ink-muted">{form.description || "No description"}</p>
            <p className="text-xs text-ink-muted">{responses.length} responses</p>
          </Card>
        ) : null}

        {!loading && !error && questionSummaries.length === 0 && shortAnswerSummary.length === 0 ? (
          <Card className="text-sm text-ink-muted">No questions available for summary.</Card>
        ) : null}

        {questionSummaries.map((summary) => {
          const maxCount = summary.options.reduce((max, option) => Math.max(max, option.count), 0);

          return (
            <Card key={summary.questionId} className="space-y-4 p-5">
              <div>
                <h2 className="text-base font-semibold">{summary.title}</h2>
                <p className="text-sm text-ink-muted">{summary.responseCount} selections</p>
              </div>

              <div className="space-y-3">
                {summary.options.map((option) => {
                  const width = maxCount > 0 ? (option.count / maxCount) * 100 : 0;

                  return (
                    <div key={option.optionId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm text-ink-muted">
                        <span>{option.label}</span>
                        <span>
                          {option.count} ({formatPercent(option.percent)})
                        </span>
                      </div>
                      <div className="h-9 rounded-lg bg-surface-2 p-1">
                        <div
                          className="h-full rounded-md bg-violet"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}

        {shortAnswerSummary.map((summary) => (
          <Card key={summary.questionId} className="space-y-3 p-5">
            <div>
              <h2 className="text-base font-semibold">{summary.title}</h2>
              <p className="text-sm text-ink-muted">{summary.entries.length} text responses</p>
            </div>

            {summary.entries.length === 0 ? (
              <p className="text-sm text-ink-muted">No answers yet.</p>
            ) : (
              <div className="space-y-2">
                {summary.entries.slice(0, 10).map((entry, index) => (
                  <p key={`${summary.questionId}-${index}`} className="rounded-xl bg-surface-2 px-3 py-2 text-sm text-ink-muted">
                    {entry}
                  </p>
                ))}
              </div>
            )}
          </Card>
        ))}
      </Container>
    </div>
  );
}
