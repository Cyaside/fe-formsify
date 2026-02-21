"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import Card from "@/shared/ui/Card";
import Container from "@/shared/ui/Container";
import { ApiError } from "@/shared/api/client";
import { formsApi } from "@/shared/api/forms";

export default function PublicFormDetailPage() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const invalidFormId = !formId;

  const formQuery = useQuery({
    queryKey: ["forms", "public", formId],
    queryFn: () => formsApi.detail(formId!),
    enabled: Boolean(formId),
    retry: false,
  });

  const unpublished =
    formQuery.error instanceof ApiError && formQuery.error.status === 404;

  const error =
    formQuery.error && !unpublished
      ? formQuery.error instanceof ApiError
        ? formQuery.error.message
        : "Failed to load form"
      : null;

  const questionsQuery = useQuery({
    queryKey: ["forms", "public", formId, "questions"],
    queryFn: () => formsApi.questions(formId!),
    enabled: Boolean(formId) && !unpublished,
    retry: false,
  });

  const form = formQuery.data?.data ?? null;
  const questions = useMemo(
    () => questionsQuery.data?.data ?? [],
    [questionsQuery.data],
  );
  const loading = formQuery.isLoading || questionsQuery.isLoading;

  const updatedLabel = useMemo(() => {
    if (!form?.updatedAt) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(form.updatedAt));
  }, [form]);
  const canFill = Boolean(formId) && !unpublished;
  const orderedQuestions = useMemo(
    () => questions.toSorted((a, b) => a.order - b.order),
    [questions],
  );

  return (
    <div className="min-h-screen bg-page py-8 text-ink">
      <Container className="max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/form-list">
            <Button variant="secondary">Back to Form List</Button>
          </Link>
          {canFill ? (
            <Link href={`/form-list/${formId}/fill`}>
              <Button>Fill Form</Button>
            </Link>
          ) : null}
        </div>

        {invalidFormId ? (
          <Card className="border-rose/40 bg-rose/10 text-sm text-rose">Invalid form ID</Card>
        ) : null}
        {loading ? <Card className="text-sm text-ink-muted">Loading form preview...</Card> : null}
        {unpublished ? (
          <Card className="border-rose/40 bg-rose/10 text-sm text-rose">
            Sorry the Forms you search isnt published yet
          </Card>
        ) : null}
        {error ? <Card className="border-rose/40 bg-rose/10 text-sm text-rose">{error}</Card> : null}

        {form && !unpublished ? (
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
              {orderedQuestions.map((question, index) => (
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
                    <ul className="list-disc space-y-1 pl-4 text-sm text-ink-muted">
                      {question.options
                        .toSorted((a, b) => a.order - b.order)
                        .map((option) => (
                          <li key={option.id}>{option.label}</li>
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
