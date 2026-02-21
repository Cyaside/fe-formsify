"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
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

export default function FormPreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const returnTo = searchParams.get("returnTo") === "builder" && formId
    ? `/forms/${formId}/edit`
    : "/dashboard/forms";

  const [form, setForm] = useState<FormDetail | null>(null);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
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
        const message = err instanceof ApiError ? err.message : "Failed to load preview";
        setError(message);
      });
  }, [formId]);

  const formattedQuestions = useMemo(() => {
    return questions.map((question) => ({
      ...question,
      options: question.options.toSorted((a, b) => a.order - b.order),
    }));
  }, [questions]);

  return (
    <div className="min-h-screen bg-page py-8 text-ink">
      <Container className="max-w-4xl space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Link href={returnTo}>
            <Button variant="secondary">Back</Button>
          </Link>
          <div className="flex items-center gap-2">
            {formId ? (
              <>
                <Button size="sm">Form</Button>
                <Link href={`/forms/${formId}/responses`}>
                  <Button variant="ghost" size="sm">Responses</Button>
                </Link>
                <Link href={`/forms/${formId}/summary`}>
                  <Button variant="ghost" size="sm">Summary</Button>
                </Link>
              </>
            ) : null}
            <Badge variant="muted">Preview only</Badge>
          </div>
        </div>

        {error ? <Card className="border-rose/40 bg-rose/10 text-sm text-rose">{error}</Card> : null}

        {form ? (
          <>
            <Card className="border-l-4 border-l-lavender p-6">
              <h1 className="text-2xl font-semibold">{form.title}</h1>
              <p className="mt-2 text-sm text-ink-muted">{form.description || "No description"}</p>
            </Card>

            {formattedQuestions.length === 0 ? (
              <Card className="text-sm text-ink-muted">No questions yet.</Card>
            ) : (
              <div className="space-y-3">
                {formattedQuestions.map((question, index) => (
                  <Card key={question.id} className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-medium">
                          {index + 1}. {question.title}
                        </h2>
                        {question.description ? (
                          <p className="mt-1 text-sm text-ink-muted">{question.description}</p>
                        ) : null}
                      </div>
                      {question.required ? <Badge variant="draft">Required</Badge> : null}
                    </div>

                    {question.options.length > 0 ? (
                      <ul className="space-y-1 text-sm text-ink-muted">
                        {question.options.map((option) => (
                          <li key={option.id}>• {option.label}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-ink-muted">{question.type === "SHORT_ANSWER" ? "Short answer" : "Text response"}</p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : null}
      </Container>
    </div>
  );
}
