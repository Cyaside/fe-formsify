"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import Button from "@/shared/ui/Button";
import Card from "@/shared/ui/Card";
import Container from "@/shared/ui/Container";
import Modal from "@/shared/ui/Modal";
import { ApiError } from "@/shared/api/client";
import {
  formsApi,
  type QuestionType,
  type ResponseRecord,
  type ResponsesPayload,
} from "@/shared/api/forms";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );

export default function FormResponsesPage() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [form, setForm] = useState<ResponsesPayload["form"] | null>(null);
  const [responses, setResponses] = useState<ResponseRecord[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(Boolean(formId));
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!formId) return;

    formsApi
      .responses(formId)
      .then((payload) => {
        setForm(payload.form);
        setResponses(payload.data);
      })
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Failed to load responses";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [formId]);

  const activeResponse = responses[activeIndex] ?? null;

  const groupedAnswers = useMemo(() => {
    if (!activeResponse) return [];

    const grouped = new Map<
      string,
      {
        questionTitle: string;
        type: QuestionType;
        entries: string[];
      }
    >();

    activeResponse.answers.forEach((answer) => {
      const key = answer.question.id;
      const existing = grouped.get(key) ?? {
        questionTitle: answer.question.title,
        type: answer.question.type,
        entries: [],
      };

      let resolved = "-";
      if (answer.question.type === "SHORT_ANSWER") {
        resolved = answer.text?.trim() || "(empty)";
      } else if (answer.optionId) {
        resolved =
          answer.question.options.find((option) => option.id === answer.optionId)?.label ||
          "(option removed)";
      }

      existing.entries.push(resolved);
      grouped.set(key, existing);
    });

    return Array.from(grouped.values());
  }, [activeResponse]);

  const handleDeleteCurrent = async () => {
    if (!formId || !activeResponse) return;
    setDeleting(true);
    setError(null);

    try {
      await formsApi.deleteResponse(formId, activeResponse.id);
      setResponses((prev) => prev.filter((item) => item.id !== activeResponse.id));
      setActiveIndex((prev) => Math.max(0, prev - 1));
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

        {error ? <Card className="border-rose/40 bg-rose/10 text-sm text-rose">{error}</Card> : null}

        {form ? (
          <Card className="space-y-2 border-l-4 border-l-lavender p-6">
            <h1 className="text-2xl font-semibold">{form.title}</h1>
            <p className="text-sm text-ink-muted">{form.description || "No description"}</p>
          </Card>
        ) : null}

        {!loading && responses.length === 0 ? (
          <Card className="text-sm text-ink-muted">No responses yet.</Card>
        ) : null}

        {activeResponse ? (
          <>
            <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2">
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

              <p className="text-sm font-medium">
                {activeIndex + 1} of {responses.length}
              </p>
              <p className="text-xs text-ink-muted">Submitted: {formatDate(activeResponse.createdAt)}</p>
            </Card>

            <div className="space-y-3">
              {groupedAnswers.map((item, index) => (
                <Card key={`${item.questionTitle}-${index}`} className="space-y-2 p-5">
                  <h2 className="text-base font-medium">{item.questionTitle}</h2>
                  <ul className="list-disc space-y-1 pl-4 text-sm text-ink-muted">
                    {item.entries.map((entry, entryIndex) => (
                      <li key={`${item.questionTitle}-${entryIndex}`}>{entry}</li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
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
