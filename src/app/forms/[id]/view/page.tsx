"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Container from "@/components/ui/Container";
import { apiRequest, ApiError } from "@/lib/api";
import type { QuestionType } from "@/store/formEditor";

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

export default function RespondentViewPage() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [form, setForm] = useState<FormDetail | null>(null);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>(
    {},
  );

  const clearValidationError = (questionId: string) => {
    setValidationErrors((prev) => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

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
      .then(([formResponse, questionsResponse]) => {
        setForm(formResponse.data);
        setQuestions(
          questionsResponse.data.sort((a, b) => a.order - b.order),
        );
      })
      .catch((err) => {
        const message =
          err instanceof ApiError ? err.message : "Gagal memuat form.";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [formId]);

  const formattedQuestions = useMemo(() => {
    return questions.map((question) => ({
      ...question,
      options: question.options.sort((a, b) => a.order - b.order),
    }));
  }, [questions]);

  const handleCheckboxChange = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? (prev[questionId] as string[]) : [];
      const exists = current.includes(optionId);
      const next = exists
        ? current.filter((item) => item !== optionId)
        : [...current, optionId];
      return { ...prev, [questionId]: next };
    });
    clearValidationError(questionId);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formId) return;
    setSubmitError(null);
    setSubmitSuccess(false);

    const nextErrors: Record<string, string> = {};
    formattedQuestions.forEach((question) => {
      const value = answers[question.id];
      if (question.required) {
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          nextErrors[question.id] = "Pertanyaan ini wajib diisi.";
        }
      }
    });

    setValidationErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value,
        })),
      };
      await apiRequest(`/api/forms/${formId}/submit`, {
        method: "POST",
        body: payload,
      });
      setSubmitSuccess(true);
      setAnswers({});
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Gagal mengirim jawaban.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-page text-ink">
      <header className="border-b border-white/10 bg-surface/70 py-8">
        <Container className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lavender">
              Form View
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-ink font-display">
              Isi formulir
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Jawaban kamu akan langsung tersimpan di sistem.
            </p>
          </div>
          <Link
            href="/form-list"
            className="rounded-full border border-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-ink-muted transition hover:text-ink"
          >
            Kembali ke Form List
          </Link>
        </Container>
      </header>

      <Container className="py-12">
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-surface/70 p-6 text-sm text-ink-muted">
            Memuat form...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose/40 bg-rose/10 p-6 text-sm text-rose">
            {error}
          </div>
        ) : !form ? (
          <div className="rounded-3xl border border-white/10 bg-surface/70 p-6 text-sm text-ink-muted">
            Form tidak ditemukan.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-6">
            <section className="rounded-3xl border border-white/10 bg-surface/70 p-6">
              <h2 className="text-lg font-semibold text-ink font-display">
                {form.title}
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                {form.description || "Tanpa deskripsi"}
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-surface/70 p-6">
              <h3 className="text-lg font-semibold text-ink font-display">
                Pertanyaan
              </h3>
              <div className="mt-6 grid gap-5">
                {formattedQuestions.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-page/70 p-4 text-sm text-ink-muted">
                    Belum ada pertanyaan untuk form ini.
                  </div>
                ) : (
                  formattedQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      className="rounded-2xl border border-white/10 bg-page/70 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
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

                      <div className="mt-4">
                        {question.type === "SHORT_TEXT" ? (
                          <input
                            type="text"
                            value={(answers[question.id] as string) ?? ""}
                            onChange={(event) => {
                              setAnswers((prev) => ({
                                ...prev,
                                [question.id]: event.target.value,
                              }));
                              clearValidationError(question.id);
                            }}
                            className="w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none"
                            placeholder="Tulis jawaban kamu"
                          />
                        ) : null}

                        {question.type === "DROPDOWN" ? (
                          <select
                            value={(answers[question.id] as string) ?? ""}
                            onChange={(event) => {
                              setAnswers((prev) => ({
                                ...prev,
                                [question.id]: event.target.value,
                              }));
                              clearValidationError(question.id);
                            }}
                            className="w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink focus:border-lavender focus:outline-none"
                          >
                            <option value="">Pilih jawaban</option>
                            {question.options.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : null}

                        {question.type === "MULTIPLE_CHOICE" ? (
                          <div className="grid gap-2">
                            {question.options.map((option) => (
                              <label
                                key={option.id}
                                className="flex items-center gap-3 text-sm text-ink"
                              >
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  value={option.id}
                                  checked={answers[question.id] === option.id}
                                  onChange={(event) => {
                                    setAnswers((prev) => ({
                                      ...prev,
                                      [question.id]: event.target.value,
                                    }));
                                    clearValidationError(question.id);
                                  }}
                                  className="h-4 w-4 rounded-full border border-white/20 bg-page/80 text-lavender focus:ring-lavender"
                                />
                                {option.label}
                              </label>
                            ))}
                          </div>
                        ) : null}

                        {question.type === "CHECKBOX" ? (
                          <div className="grid gap-2">
                            {question.options.map((option) => {
                              const selected = Array.isArray(answers[question.id])
                                ? (answers[question.id] as string[])
                                : [];
                              return (
                                <label
                                  key={option.id}
                                  className="flex items-center gap-3 text-sm text-ink"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected.includes(option.id)}
                                    onChange={() =>
                                      handleCheckboxChange(question.id, option.id)
                                    }
                                    className="h-4 w-4 rounded border border-white/20 bg-page/80 text-lavender focus:ring-lavender"
                                  />
                                  {option.label}
                                </label>
                              );
                            })}
                          </div>
                        ) : null}

                        {validationErrors[question.id] ? (
                          <p className="mt-3 text-sm text-rose">
                            {validationErrors[question.id]}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {submitError ? (
              <div className="rounded-2xl border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
                {submitError}
              </div>
            ) : null}
            {submitSuccess ? (
              <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                Jawaban berhasil dikirim. Terima kasih!
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-lavender px-6 py-3 text-sm font-semibold text-violet-deep transition hover:-translate-y-0.5 hover:bg-sun disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Mengirim..." : "Kirim Jawaban"}
            </button>
          </form>
        )}
      </Container>
    </div>
  );
}
