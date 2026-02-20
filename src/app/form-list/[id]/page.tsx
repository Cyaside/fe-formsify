"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import { apiRequest, ApiError } from "@/lib/api";

type QuestionType = "SHORT_ANSWER" | "MCQ" | "CHECKBOX" | "DROPDOWN";

type FormDetail = {
  id: string;
  title: string;
  description?: string | null;
  updatedAt: string;
};

type QuestionResponse = {
  id: string;
  title: string;
  description?: string | null;
  type: QuestionType;
  required: boolean;
  order: number;
  options: { id: string; label: string; order: number }[];
};

export default function PublicFormDetailPage() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const invalidFormId = !formId;

  const [form, setForm] = useState<FormDetail | null>(null);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(Boolean(formId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!formId) return;
    Promise.all([
      apiRequest<{ data: FormDetail }>(`/api/forms/${formId}`),
      apiRequest<{ data: QuestionResponse[] }>(`/api/forms/${formId}/questions`),
    ])
      .then(([formResponse, questionResponse]) => {
        setForm(formResponse.data);
        setQuestions(questionResponse.data.toSorted((a, b) => a.order - b.order));
      })
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Failed to load form";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [formId]);

  const updatedLabel = useMemo(() => {
    if (!form) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(form.updatedAt));
  }, [form]);

  return (
    <div className="min-h-screen bg-page py-8 text-ink">
      <Container className="max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/form-list">
            <Button variant="secondary">Back to Form List</Button>
          </Link>
          {formId ? (
            <Link href={`/forms/${formId}/view`}>
              <Button>Fill Form</Button>
            </Link>
          ) : null}
        </div>

        {invalidFormId ? (
          <Card className="border-rose/40 bg-rose/10 text-sm text-rose">Invalid form ID</Card>
        ) : null}
        {loading ? <Card className="text-sm text-ink-muted">Loading form preview...</Card> : null}
        {error ? <Card className="border-rose/40 bg-rose/10 text-sm text-rose">{error}</Card> : null}

        {form ? (
          <>
            <Card className="space-y-3 border-l-4 border-l-lavender p-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">{form.title}</h1>
                <Badge variant="muted">Read only</Badge>
              </div>
              <p className="text-sm text-ink-muted">{form.description || "No description"}</p>
              <p className="text-xs text-ink-muted">Updated: {updatedLabel}</p>
            </Card>

            <Card className="space-y-2 p-5">
              <h2 className="text-base font-semibold">Statistics</h2>
              <p className="text-sm text-ink-muted">Summary stats will appear here in the next iteration.</p>
            </Card>

            <div className="space-y-3">
              {questions.map((question, index) => (
                <Card key={question.id} className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-medium">
                        {index + 1}. {question.title}
                      </h3>
                      {question.description ? (
                        <p className="mt-1 text-sm text-ink-muted">{question.description}</p>
                      ) : null}
                    </div>
                    {question.required ? <Badge variant="draft">Required</Badge> : null}
                  </div>

                  {question.options.length > 0 ? (
                    <ul className="space-y-1 text-sm text-ink-muted">
                      {question.options
                        .toSorted((a, b) => a.order - b.order)
                        .map((option) => (
                          <li key={option.id}>• {option.label}</li>
                        ))}
                    </ul>
                  ) : null}
                </Card>
              ))}
            </div>
          </>
        ) : null}
      </Container>
    </div>
  );
}
