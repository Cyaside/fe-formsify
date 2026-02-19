"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Container from "@/components/ui/Container";
import { apiRequest, ApiError } from "@/lib/api";
import type { QuestionType } from "@/store/formEditor";

type FormDetail = {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    email: string;
    name?: string | null;
  } | null;
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
  const [form, setForm] = useState<FormDetail | null>(null);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!formId) {
      setLoading(false);
      setError("ID form tidak valid.");
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      apiRequest<{ data: FormDetail }>(`/api/forms/${formId}`),
      apiRequest<{ data: QuestionResponse[] }>(`/api/forms/${formId}/questions`),
    ])
      .then(([formResponse, questionResponse]) => {
        setForm(formResponse.data);
        setQuestions(questionResponse.data.sort((a, b) => a.order - b.order));
      })
      .catch((err) => {
        const message =
          err instanceof ApiError ? err.message : "Gagal memuat detail form.";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [formId]);

  const formatted = useMemo(() => {
    if (!form) return null;
    const formatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
    return {
      ...form,
      updatedLabel: formatter.format(new Date(form.updatedAt)),
      ownerLabel: form.owner?.name || form.owner?.email || "Anonymous",
    };
  }, [form]);

  const formattedQuestions = useMemo(() => {
    return questions.map((question) => ({
      ...question,
      options: question.options.sort((a, b) => a.order - b.order),
    }));
  }, [questions]);

  return (
    <div className="min-h-screen bg-page text-ink">
      <header className="border-b border-white/10 bg-surface/70 py-8">
        <Container className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lavender">
              Form Preview
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-ink font-display">
              Detail form
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Informasi form dan daftar pertanyaan dalam mode read-only.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {formId ? (
              <Link
                href={`/forms/${formId}/view`}
                className="rounded-full border border-lavender/40 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-lavender transition hover:bg-lavender hover:text-violet-deep"
              >
                Isi Form
              </Link>
            ) : null}
            <Link
              href="/form-list"
              className="rounded-full border border-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-ink-muted transition hover:text-ink"
            >
              Kembali ke Form List
            </Link>
          </div>
        </Container>
      </header>

      <Container className="py-12">
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-surface/70 p-6 text-sm text-ink-muted">
            Memuat detail form...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose/40 bg-rose/10 p-6 text-sm text-rose">
            {error}
          </div>
        ) : !formatted ? (
          <div className="rounded-3xl border border-white/10 bg-surface/70 p-6 text-sm text-ink-muted">
            Form tidak ditemukan.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-3xl border border-white/10 bg-surface/70 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink font-display">
                  {formatted.title}
                </h2>
                <span className="rounded-full border border-lavender/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-lavender">
                  Read-only
                </span>
              </div>
              <p className="mt-4 text-sm text-ink-muted">
                {formatted.description || "Tanpa deskripsi"}
              </p>
              <div className="mt-6 grid gap-3 text-xs uppercase tracking-[0.28em] text-ink-muted">
                <span>Owner: {formatted.ownerLabel}</span>
                <span>Diupdate {formatted.updatedLabel}</span>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-surface/70 p-6">
              <h2 className="text-lg font-semibold text-ink font-display">
                Daftar pertanyaan
              </h2>
              <div className="mt-4 grid gap-4">
                {formattedQuestions.length === 0 ? (
                  <p className="text-sm text-ink-muted">
                    Belum ada pertanyaan yang dapat ditampilkan.
                  </p>
                ) : (
                  formattedQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      className="rounded-2xl border border-white/10 bg-page/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            {index + 1}. {question.title}
                          </p>
                          {question.description ? (
                            <p className="mt-2 text-sm text-ink-muted">
                              {question.description}
                            </p>
                          ) : null}
                        </div>
                        {question.required ? (
                          <span className="rounded-full border border-rose/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-rose">
                            Wajib
                          </span>
                        ) : null}
                      </div>
                      {question.options.length > 0 ? (
                        <ul className="mt-3 grid gap-2 text-sm text-ink-muted">
                          {question.options.map((option) => (
                            <li key={option.id}>- {option.label}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </Container>
    </div>
  );
}
