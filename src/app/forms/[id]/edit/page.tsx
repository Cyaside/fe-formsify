"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Container from "@/components/ui/Container";
import RequireAuth from "@/components/auth/RequireAuth";
import { apiRequest, ApiError } from "@/lib/api";
import {
  useFormEditorStore,
  type EditorQuestion,
  type QuestionType,
} from "@/store/formEditor";

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

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "SHORT_TEXT", label: "Short Answer" },
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "DROPDOWN", label: "Dropdown" },
];

const requiresOptions = (type: QuestionType) =>
  type === "MULTIPLE_CHOICE" || type === "CHECKBOX" || type === "DROPDOWN";

const createTempId = () => `temp_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export default function FormEditorPage() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const {
    title,
    description,
    questions,
    removedQuestionIds,
    setFormId,
    setFormMeta,
    setQuestions,
    replaceQuestionId,
    addQuestion,
    updateQuestion,
    removeQuestion,
    addOption,
    updateOption,
    removeOption,
    moveOption,
    clearRemovedQuestionIds,
    reset,
  } = useFormEditorStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<QuestionType>("SHORT_TEXT");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!requiresOptions(newType)) {
      setNewOptions([]);
    }
  }, [newType]);

  useEffect(() => {
    if (!formId) {
      setLoading(false);
      setError("ID form tidak valid.");
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([
      apiRequest<{ data: FormDetail }>(`/api/forms/${formId}`),
      apiRequest<{ data: QuestionResponse[] }>(`/api/forms/${formId}/questions`),
    ])
      .then(([formResponse, questionResponse]) => {
        if (!active) return;
        const form = formResponse.data;
        const questionsData = questionResponse.data
          .sort((a, b) => a.order - b.order)
          .map<EditorQuestion>((question) => ({
            id: question.id,
            title: question.title,
            description: question.description ?? "",
            type: question.type,
            required: question.required,
            order: question.order,
            options: question.options
              .sort((a, b) => a.order - b.order)
              .map((option) => option.label),
          }));

        setFormId(form.id);
        setFormMeta(form.title, form.description ?? "");
        setQuestions(questionsData);
        clearRemovedQuestionIds();
      })
      .catch((err) => {
        if (!active) return;
        const message =
          err instanceof ApiError ? err.message : "Gagal memuat data form.";
        setError(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      reset();
    };
  }, [clearRemovedQuestionIds, formId, reset, setFormId, setFormMeta, setQuestions]);

  const normalizedQuestions = useMemo(() => {
    return questions.map((question, index) => ({
      ...question,
      order: index,
    }));
  }, [questions]);

  const handleAddQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError(null);

    if (!newTitle.trim()) {
      setSaveError("Judul pertanyaan wajib diisi.");
      return;
    }

    const options =
      requiresOptions(newType) && newOptions.length > 0
        ? newOptions.map((option) => option.trim()).filter((option) => option.length > 0)
        : [];

    if (requiresOptions(newType) && options.length === 0) {
      setSaveError("Tambahkan minimal satu opsi jawaban.");
      return;
    }

    const question: EditorQuestion = {
      id: createTempId(),
      title: newTitle.trim(),
      description: newDescription.trim(),
      type: newType,
      required: newRequired,
      order: questions.length,
      options,
    };
    addQuestion(question);
    setNewTitle("");
    setNewDescription("");
    setNewType("SHORT_TEXT");
    setNewRequired(false);
    setNewOptions([]);
  };

  const handleSave = async () => {
    if (!formId) return;
    setSaving(true);
    setSaveError(null);

    if (!title.trim()) {
      setSaveError("Judul form wajib diisi.");
      setSaving(false);
      return;
    }

    try {
      await apiRequest(`/api/forms/${formId}`, {
        method: "PUT",
        body: {
          title: title.trim(),
          description: description.trim() || null,
        },
      });

      for (const questionId of removedQuestionIds) {
        await apiRequest(`/api/questions/${questionId}`, { method: "DELETE" });
      }

      for (const [index, question] of normalizedQuestions.entries()) {
        if (!question.title.trim()) {
          throw new ApiError(400, "Judul pertanyaan tidak boleh kosong.");
        }
        if (requiresOptions(question.type) && question.options.length === 0) {
          throw new ApiError(400, "Pertanyaan pilihan harus memiliki opsi.");
        }

        const payload = {
          title: question.title.trim(),
          description: question.description.trim() || null,
          type: question.type,
          required: question.required,
          order: index,
          options: question.options,
        };

        if (question.id.startsWith("temp_")) {
          const created = await apiRequest<{ data: QuestionResponse }>(
            `/api/forms/${formId}/questions`,
            {
              method: "POST",
              body: payload,
            },
          );
          replaceQuestionId(question.id, created.data.id);
        } else {
          await apiRequest(`/api/questions/${question.id}`, {
            method: "PUT",
            body: payload,
          });
        }
      }

      clearRemovedQuestionIds();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Gagal menyimpan perubahan.";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <RequireAuth>
      <div className="min-h-screen bg-page text-ink">
        <header className="border-b border-white/10 bg-surface/70 py-8">
          <Container className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lavender">
                Form Builder
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-ink font-display">
                Edit pertanyaan form
              </h1>
              <p className="mt-2 text-sm text-ink-muted">
                Kelola struktur pertanyaan tanpa membuat halaman baru untuk setiap
                form.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/forms"
                className="rounded-full border border-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-ink-muted transition hover:text-ink"
              >
                Kembali ke Form List
              </Link>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-lavender px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-violet-deep transition hover:bg-sun disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </Container>
        </header>

        <Container className="py-12">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-surface/70 p-6 text-sm text-ink-muted">
              Memuat editor form...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-rose/40 bg-rose/10 p-6 text-sm text-rose">
              {error}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-3xl border border-white/10 bg-surface/70 p-6">
                <h2 className="text-lg font-semibold text-ink font-display">
                  Informasi form
                </h2>
                <div className="mt-5 flex flex-col gap-4">
                  <label className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
                    Judul form
                    <input
                      type="text"
                      value={title}
                      onChange={(event) =>
                        setFormMeta(event.target.value, description)
                      }
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none"
                    />
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
                    Deskripsi
                    <textarea
                      value={description}
                      onChange={(event) =>
                        setFormMeta(title, event.target.value)
                      }
                      className="mt-3 min-h-[120px] w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none"
                    />
                  </label>
                </div>

                <h3 className="mt-10 text-base font-semibold text-ink font-display">
                  Tambah pertanyaan
                </h3>
                <form onSubmit={handleAddQuestion} className="mt-4 flex flex-col gap-4">
                  <label className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
                    Judul pertanyaan
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(event) => setNewTitle(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none"
                    />
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
                    Deskripsi (opsional)
                    <textarea
                      value={newDescription}
                      onChange={(event) => setNewDescription(event.target.value)}
                      className="mt-2 min-h-[90px] w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none"
                    />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
                      Tipe pertanyaan
                      <select
                        value={newType}
                        onChange={(event) =>
                          setNewType(event.target.value as QuestionType)
                        }
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink focus:border-lavender focus:outline-none"
                      >
                        {QUESTION_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
                      <input
                        type="checkbox"
                        checked={newRequired}
                        onChange={(event) => setNewRequired(event.target.checked)}
                        className="h-4 w-4 rounded border border-white/20 bg-page/80 text-lavender focus:ring-lavender"
                      />
                      Wajib diisi
                    </label>
                  </div>

                  {requiresOptions(newType) ? (
                    <div className="flex flex-col gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
                        Opsi jawaban
                      </p>
                      {(newOptions.length === 0 ? [""] : newOptions).map(
                        (option, index) => (
                          <input
                            key={`new-option-${index}`}
                            type="text"
                            value={option}
                            onChange={(event) =>
                              setNewOptions((prev) => {
                                const next = [...prev];
                                next[index] = event.target.value;
                                return next;
                              })
                            }
                            placeholder={`Opsi ${index + 1}`}
                            className="w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none"
                          />
                        ),
                      )}
                      <button
                        type="button"
                        onClick={() => setNewOptions((prev) => [...prev, ""])}
                        className="self-start rounded-full border border-lavender/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-lavender transition hover:bg-lavender hover:text-violet-deep"
                      >
                        Tambah opsi
                      </button>
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    className="self-start rounded-full bg-lavender px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-violet-deep transition hover:bg-sun"
                  >
                    Tambah Pertanyaan
                  </button>
                </form>
              </section>

              <section className="rounded-3xl border border-white/10 bg-surface/70 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-ink font-display">
                    Pertanyaan aktif
                  </h2>
                  <span className="text-xs uppercase tracking-[0.28em] text-ink-muted">
                    Total: {questions.length}
                  </span>
                </div>

                {saveError ? (
                  <div className="mt-4 rounded-2xl border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
                    {saveError}
                  </div>
                ) : null}

                <div className="mt-6 grid gap-4">
                  {normalizedQuestions.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-page/70 p-4 text-sm text-ink-muted">
                      Belum ada pertanyaan. Tambahkan pertanyaan pertama di panel
                      kiri.
                    </div>
                  ) : (
                    normalizedQuestions.map((question, index) => (
                      <div
                        key={question.id}
                        className="rounded-2xl border border-white/10 bg-page/70 p-4"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.28em] text-ink-muted">
                            <span>Pertanyaan {index + 1}</span>
                            <span>{QUESTION_TYPES.find((item) => item.value === question.type)?.label}</span>
                          </div>

                          <label className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
                            Judul
                            <input
                              type="text"
                              value={question.title}
                              onChange={(event) =>
                                updateQuestion(question.id, { title: event.target.value })
                              }
                              className="mt-2 w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none"
                            />
                          </label>
                          <label className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
                            Deskripsi (opsional)
                            <textarea
                              value={question.description}
                              onChange={(event) =>
                                updateQuestion(question.id, {
                                  description: event.target.value,
                                })
                              }
                              className="mt-2 min-h-[80px] w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none"
                            />
                          </label>
                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
                              Tipe
                              <select
                                value={question.type}
                                onChange={(event) => {
                                  const nextType = event.target.value as QuestionType;
                                  updateQuestion(question.id, {
                                    type: nextType,
                                    options: requiresOptions(nextType)
                                      ? question.options.length
                                        ? question.options
                                        : [""]
                                      : [],
                                  });
                                }}
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink focus:border-lavender focus:outline-none"
                              >
                                {QUESTION_TYPES.map((type) => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
                              <input
                                type="checkbox"
                                checked={question.required}
                                onChange={(event) =>
                                  updateQuestion(question.id, {
                                    required: event.target.checked,
                                  })
                                }
                                className="h-4 w-4 rounded border border-white/20 bg-page/80 text-lavender focus:ring-lavender"
                              />
                              Wajib diisi
                            </label>
                          </div>

                          {requiresOptions(question.type) ? (
                            <div className="flex flex-col gap-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
                                Opsi jawaban
                              </p>
                              {question.options.map((option, optionIndex) => (
                                <div key={`${question.id}-option-${optionIndex}`} className="flex flex-wrap gap-2">
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(event) =>
                                      updateOption(
                                        question.id,
                                        optionIndex,
                                        event.target.value,
                                      )
                                    }
                                    className="flex-1 rounded-2xl border border-white/10 bg-page/80 px-4 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      moveOption(question.id, optionIndex, optionIndex - 1)
                                    }
                                    className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-ink-muted transition hover:text-ink"
                                  >
                                    Naik
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      moveOption(question.id, optionIndex, optionIndex + 1)
                                    }
                                    className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-ink-muted transition hover:text-ink"
                                  >
                                    Turun
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeOption(question.id, optionIndex)}
                                    className="rounded-full border border-rose/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-rose transition hover:bg-rose hover:text-white"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addOption(question.id, "")}
                                className="self-start rounded-full border border-lavender/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-lavender transition hover:bg-lavender hover:text-violet-deep"
                              >
                                Tambah opsi
                              </button>
                            </div>
                          ) : null}

                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => removeQuestion(question.id)}
                              className="rounded-full border border-rose/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-rose transition hover:bg-rose hover:text-white"
                            >
                              Hapus pertanyaan
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}
        </Container>
      </div>
    </RequireAuth>
  );
}
