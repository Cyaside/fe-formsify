"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import Button from "@/shared/ui/Button";
import Card from "@/shared/ui/Card";
import Container from "@/shared/ui/Container";
import Modal from "@/shared/ui/Modal";
import ResponseAnswerCards from "@/features/forms/responses/components/ResponseAnswerCards";
import { ApiError } from "@/shared/api/client";
import {
  formsApi,
  type ResponsesPayload,
} from "@/shared/api/forms";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );

export default function FormResponsesPage({
  initialFormId,
}: Readonly<{
  initialFormId?: string;
}>) {
  const formId = initialFormId;
  const queryClient = useQueryClient();

  const [activeIndex, setActiveIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["form-responses", formId, page, pageSize],
    queryFn: () => formsApi.responses(formId!, { page, limit: pageSize }),
    enabled: Boolean(formId),
    placeholderData: (previous) => previous,
  });

  const form = data?.form ?? null;
  const responses = data?.data ?? [];
  const meta = data?.meta;
  const totalResponses = meta?.total ?? responses.length;
  const totalPages = meta?.totalPages ?? 1;
  const loadError =
    error ??
    (queryError
      ? queryError instanceof ApiError
        ? queryError.message
        : "Failed to load responses"
      : null);

  const activeResponse = responses[activeIndex] ?? null;
  const activeResponseDetailHref =
    formId && activeResponse ? `/forms/${formId}/responses/${activeResponse.id}` : null;

  useEffect(() => {
    setActiveIndex(0);
  }, [page]);

  useEffect(() => {
    if (responses.length === 0 && page > 1 && !isFetching) {
      setPage((prev) => Math.max(1, prev - 1));
    }
  }, [isFetching, page, responses.length]);

  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, Math.max(0, responses.length - 1)));
  }, [responses.length]);

  const handleDeleteCurrent = async () => {
    if (!formId || !activeResponse) return;
    setDeleting(true);
    setError(null);

    try {
      await formsApi.deleteResponse(formId, activeResponse.id);
      await queryClient.invalidateQueries({
        queryKey: ["form-responses", formId],
      });
      setDeleteOpen(false);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to delete response";
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-page py-8 text-ink">
      <Container className="max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/forms">
              <Button variant="secondary">Back to Forms</Button>
            </Link>
            {formId ? (
              <>
                <Link href={`/forms/${formId}/view`}>
                  <Button variant="ghost" size="sm">Form</Button>
                </Link>
                <Button size="sm">Responses</Button>
                <Link href={`/forms/${formId}/summary`}>
                  <Button variant="ghost" size="sm">Summary</Button>
                </Link>
              </>
            ) : null}
          </div>
          {activeResponse ? (
            <Button variant="danger" className="gap-2" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={15} />
              Delete Response
            </Button>
          ) : null}
        </div>

        {loadError ? (
          <Card className="border-rose/40 bg-rose/10 text-sm text-rose">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button variant="secondary" size="sm" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          </Card>
        ) : null}

        {form ? (
          <Card className="space-y-2 border-l-4 border-l-accent p-6">
            <h1 className="text-2xl font-semibold">{form.title}</h1>
            <p className="text-sm text-ink-muted">{form.description || "No description"}</p>
          </Card>
        ) : null}

        {isLoading ? <Card className="text-sm text-ink-muted">Loading responses...</Card> : null}
        {!isLoading && isFetching ? (
          <Card className="text-sm text-ink-muted">Refreshing responses...</Card>
        ) : null}

        {!isLoading && !loadError && responses.length === 0 ? (
          <Card className="text-sm text-ink-muted">No responses yet.</Card>
        ) : null}

        {activeResponse ? (
          <>
            <Card className="flex flex-wrap items-center gap-3 p-4">
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1"
                  onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeIndex === 0}
                >
                  <ChevronLeft size={14} />
                  Prev
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1"
                  onClick={() =>
                    setActiveIndex((prev) => Math.min(responses.length - 1, prev + 1))
                  }
                  disabled={activeIndex >= responses.length - 1}
                >
                  Next
                  <ChevronRight size={14} />
                </Button>
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-medium">
                  {activeIndex + 1} of {responses.length} (page {page} of {totalPages})
                </p>
                {activeResponseDetailHref ? (
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                      Response
                    </span>
                    <Link
                      href={activeResponseDetailHref}
                      className="inline-flex h-7 items-center rounded-md border border-border bg-surface px-2 text-xs text-accent transition-colors hover:border-accent-500/40 hover:bg-surface-2 hover:underline"
                      title={activeResponseDetailHref}
                    >
                      View Response Page
                    </Link>
                  </div>
                ) : null}
              </div>
              <p className="shrink-0 whitespace-nowrap text-xs text-ink-muted">
                Submitted: {formatDate(activeResponse.createdAt)}
              </p>
            </Card>

            <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={14} />
                  Prev Page
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                >
                  Next Page
                  <ChevronRight size={14} />
                </Button>
              </div>
              <p className="text-sm text-ink-muted">Total responses: {totalResponses}</p>
            </Card>

            <ResponseAnswerCards
              answers={activeResponse.answers}
              emptyMessage="No answers in this response."
            />
          </>
        ) : null}

        <Modal
          open={deleteOpen}
          title="Delete response"
          description="Delete currently viewed response permanently?"
          onClose={() => {
            if (!deleting) setDeleteOpen(false);
          }}
        >
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteCurrent} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </Modal>
      </Container>
    </div>
  );
}
