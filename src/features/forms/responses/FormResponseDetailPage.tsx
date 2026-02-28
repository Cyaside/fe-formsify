"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/shared/ui/Button";
import Card from "@/shared/ui/Card";
import Container from "@/shared/ui/Container";
import ResponseAnswerCards from "@/features/forms/responses/components/ResponseAnswerCards";
import { buildResponseSectionPages } from "@/features/forms/responses/lib/responseSections";
import { ApiError } from "@/shared/api/client";
import {
  formsApi,
  type ResponseDetailPayload,
} from "@/shared/api/forms";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );

export default function FormResponseDetailPage({
  initialFormId,
  initialResponseId,
}: Readonly<{
  initialFormId?: string;
  initialResponseId?: string;
}>) {
  const formId = initialFormId;
  const responseId = initialResponseId;
  const enabled = Boolean(formId && responseId);
  const [sectionIndex, setSectionIndex] = useState(0);
  const {
    data: payload,
    isLoading: loading,
    error: queryError,
  } = useQuery<ResponseDetailPayload>({
    queryKey: ["form-response-detail", formId, responseId],
    queryFn: () => formsApi.responseDetail(formId!, responseId!),
    enabled,
  });
  const { data: questionData } = useQuery({
    queryKey: ["form-questions", formId],
    queryFn: () => formsApi.questions(formId!),
    enabled: Boolean(formId),
  });
  const { data: sectionData } = useQuery({
    queryKey: ["form-sections", formId],
    queryFn: () => formsApi.sections(formId!),
    enabled: Boolean(formId),
  });

  const sectionPages = useMemo(
    () =>
      buildResponseSectionPages({
        answers: payload?.data.answers ?? [],
        sections: sectionData?.data ?? [],
        questions: questionData?.data ?? [],
      }),
    [payload?.data.answers, questionData?.data, sectionData?.data],
  );
  const activeSectionIndex = useMemo(() => {
    if (sectionPages.length === 0) return 0;
    const clamped = Math.min(sectionIndex, sectionPages.length - 1);
    return Math.max(0, clamped);
  }, [sectionIndex, sectionPages.length]);
  const activeSectionPage = sectionPages[activeSectionIndex] ?? null;

  const error = queryError
    ? queryError instanceof ApiError
      ? queryError.message
      : "Failed to load response"
    : null;

  const responseApiPath =
    formId && responseId ? `/api/forms/${formId}/responses/${responseId}` : null;

  return (
    <div className="min-h-screen bg-page py-8 text-ink">
      <Container className="max-w-4xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/forms">
              <Button variant="secondary">Back to Forms</Button>
            </Link>
          </div>
          {formId ? (
            <Link href={`/forms/${formId}/responses`}>
              <Button size="sm">Back to Response List</Button>
            </Link>
          ) : null}
        </div>

        {loading ? <Card className="text-sm text-ink-muted">Loading response...</Card> : null}
        {error ? <Card className="border-rose/40 bg-rose/10 text-sm text-rose">{error}</Card> : null}

        {payload ? (
          <>
            <Card className="space-y-2 border-l-4 border-l-accent p-6">
              <h1 className="text-2xl font-semibold">{payload.form.title}</h1>
              <p className="text-sm text-ink-muted">
                {payload.form.description || "No description"}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <p className="text-xs text-ink-muted">
                  Submitted: {formatDate(payload.data.createdAt)}
                </p>
                {responseApiPath ? (
                  <code
                    className="min-w-0 truncate rounded bg-surface-2 px-2 py-1 text-[11px] text-ink-muted"
                    title={responseApiPath}
                  >
                    {responseApiPath}
                  </code>
                ) : null}
              </div>
            </Card>

            <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
                  Section
                </p>
                <p className="text-sm font-medium">
                  Section {activeSectionIndex + 1} of {Math.max(1, sectionPages.length)}
                </p>
                {activeSectionPage ? (
                  <div>
                    <p className="text-sm text-ink">{activeSectionPage.title}</p>
                    {activeSectionPage.description ? (
                      <p className="text-xs text-ink-muted">{activeSectionPage.description}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSectionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeSectionIndex <= 0}
                >
                  <ChevronLeft size={14} />
                  Prev Section
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setSectionIndex((prev) => Math.min(Math.max(0, sectionPages.length - 1), prev + 1))
                  }
                  disabled={activeSectionIndex >= sectionPages.length - 1}
                >
                  Next Section
                  <ChevronRight size={14} />
                </Button>
              </div>
            </Card>

            <ResponseAnswerCards
              answers={activeSectionPage?.answers ?? []}
              questionOrderById={activeSectionPage?.questionOrderById}
              emptyMessage="No answers in this response."
            />
          </>
        ) : null}
      </Container>
    </div>
  );
}
