"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import RequireAuth from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiRequest, ApiError } from "@/lib/api";

type FormSummary = {
  id: string;
  title: string;
  description?: string | null;
  updatedAt: string;
  createdAt: string;
};

function normalizeDescription(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function validateTitle(value: string) {
  if (!value.trim()) {
    return "Judul wajib diisi.";
  }
  return null;
}

export default function FormsPage() {
  const { user, logout } = useAuth();
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    apiRequest<{ data: FormSummary[] }>("/api/forms")
      .then((data) => {
        setForms(data.data);
      })
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Gagal memuat form.";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const formattedForms = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
    return forms.map((form) => ({
      ...form,
      updatedLabel: formatter.format(new Date(form.updatedAt)),
    }));
  }, [forms]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);
    setDeleteError(null);

    const titleError = validateTitle(createTitle);
    if (titleError) {
      setCreateError(titleError);
      return;
    }

    setCreateLoading(true);
    try {
      const payload = {
        title: createTitle.trim(),
        description: normalizeDescription(createDescription),
      };
      const data = await apiRequest<{ data: FormSummary }>("/api/forms", {
        method: "POST",
        body: payload,
      });
      setForms((prev) => [data.data, ...prev]);
      setCreateTitle("");
      setCreateDescription("");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Gagal membuat form.";
      setCreateError(message);
    } finally {
      setCreateLoading(false);
    }
  };

  const startEdit = (form: FormSummary) => {
    setEditingId(form.id);
    setEditTitle(form.title);
    setEditDescription(form.description ?? "");
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditError(null);
  };

  const handleUpdate = async (formId: string) => {
    setEditError(null);
    setDeleteError(null);

    const titleError = validateTitle(editTitle);
    if (titleError) {
      setEditError(titleError);
      return;
    }

    setEditLoadingId(formId);
    try {
      const payload = {
        title: editTitle.trim(),
        description: normalizeDescription(editDescription),
      };
      const data = await apiRequest<{ data: FormSummary }>(`/api/forms/${formId}`, {
        method: "PUT",
        body: payload,
      });
      setForms((prev) => prev.map((form) => (form.id === formId ? data.data : form)));
      cancelEdit();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Gagal memperbarui form.";
      setEditError(message);
    } finally {
      setEditLoadingId(null);
    }
  };

  const handleDelete = async (formId: string) => {
    setDeleteError(null);
    const confirmed = window.confirm("Yakin ingin menghapus form ini?");
    if (!confirmed) return;

    setDeleteLoadingId(formId);
    try {
      await apiRequest(`/api/forms/${formId}`, { method: "DELETE" });
      setForms((prev) => prev.filter((form) => form.id !== formId));
      if (editingId === formId) {
        cancelEdit();
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Gagal menghapus form.";
      setDeleteError(message);
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <RequireAuth>
      <div className="min-h-screen bg-page text-ink">
        <header className="border-b border-white/10 bg-surface/70 py-8">
          <Container className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lavender">
                Form List
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-ink font-display">
                Daftar form kamu
              </h1>
              <p className="mt-2 text-sm text-ink-muted">
                Buat, edit, dan hapus form langsung dari halaman ini.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-full border border-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-ink-muted transition hover:text-ink"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-lavender/40 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-lavender transition hover:bg-lavender hover:text-violet-deep"
              >
                Logout
              </button>
            </div>
          </Container>
        </header>

        <Container className="py-12">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl border border-white/10 bg-surface/70 p-6">
              <h2 className="text-lg font-semibold text-ink font-display">
                Buat form baru
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                Isi judul dan deskripsi singkat sebelum menambahkan pertanyaan.
              </p>
              <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-4">
                <label className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
                  Judul form
                  <input
                    type="text"
                    name="title"
                    value={createTitle}
                    onChange={(event) => setCreateTitle(event.target.value)}
                    placeholder="Contoh: Feedback Event 2026"
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none"
                    required
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
                  Deskripsi (opsional)
                  <textarea
                    name="description"
                    value={createDescription}
                    onChange={(event) => setCreateDescription(event.target.value)}
                    placeholder="Deskripsi singkat untuk membantu responden."
                    className="mt-3 min-h-[120px] w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none"
                  />
                </label>

                {createError ? (
                  <div className="rounded-2xl border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
                    {createError}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={createLoading}
                  className="inline-flex items-center justify-center rounded-full bg-lavender px-6 py-3 text-sm font-semibold text-violet-deep transition hover:-translate-y-0.5 hover:bg-sun disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {createLoading ? "Membuat..." : "Buat Form"}
                </button>
              </form>
            </section>

            <section className="rounded-3xl border border-white/10 bg-surface/70 p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-ink font-display">
                    Form kamu
                  </h2>
                  <p className="text-sm text-ink-muted">
                    Kelola status dan metadata form yang sudah dibuat.
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-muted">
                  Total: {forms.length}
                </span>
              </div>

              {deleteError ? (
                <div className="mt-4 rounded-2xl border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
                  {deleteError}
                </div>
              ) : null}

              <div className="mt-6 grid gap-4">
                {loading ? (
                  <div className="rounded-2xl border border-white/10 bg-page/70 p-4 text-sm text-ink-muted">
                    Memuat daftar form...
                  </div>
                ) : error ? (
                  <div className="rounded-2xl border border-rose/40 bg-rose/10 p-4 text-sm text-rose">
                    {error}
                  </div>
                ) : formattedForms.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-page/70 p-4 text-sm text-ink-muted">
                    Belum ada form. Buat form baru untuk mulai.
                  </div>
                ) : (
                  formattedForms.map((form) => {
                    const isEditing = editingId === form.id;
                    const isUpdating = editLoadingId === form.id;
                    const isDeleting = deleteLoadingId === form.id;

                    return (
                      <div
                        key={form.id}
                        className="rounded-2xl border border-white/10 bg-page/70 p-4"
                      >
                        {isEditing ? (
                          <div className="flex flex-col gap-3">
                            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
                              Judul form
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(event) => setEditTitle(event.target.value)}
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none"
                              />
                            </label>
                            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-lavender">
                              Deskripsi (opsional)
                              <textarea
                                value={editDescription}
                                onChange={(event) => setEditDescription(event.target.value)}
                                className="mt-2 min-h-[90px] w-full rounded-2xl border border-white/10 bg-page/80 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-lavender focus:outline-none"
                              />
                            </label>

                            {editError ? (
                              <div className="rounded-2xl border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
                                {editError}
                              </div>
                            ) : null}

                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => handleUpdate(form.id)}
                                disabled={isUpdating}
                                className="rounded-full bg-lavender px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-violet-deep transition hover:bg-sun disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                {isUpdating ? "Menyimpan..." : "Simpan"}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={isUpdating}
                                className="rounded-full border border-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-ink-muted transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-ink">{form.title}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.28em] text-ink-muted">
                                Diupdate {form.updatedLabel}
                              </p>
                              <p className="mt-3 text-sm text-ink-muted">
                                {form.description || "Tanpa deskripsi"}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.28em]">
                              <Link
                                href={`/forms/${form.id}/edit`}
                                className="rounded-full border border-white/10 px-4 py-2 font-semibold text-ink-muted transition hover:text-ink"
                              >
                                Builder
                              </Link>
                              <Link
                                href={`/forms/${form.id}/view`}
                                className="rounded-full border border-white/10 px-4 py-2 font-semibold text-ink-muted transition hover:text-ink"
                              >
                                Preview
                              </Link>
                              <button
                                type="button"
                                onClick={() => startEdit(form)}
                                className="rounded-full border border-lavender/40 px-4 py-2 font-semibold text-lavender transition hover:bg-lavender hover:text-violet-deep"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(form.id)}
                                disabled={isDeleting}
                                className="rounded-full border border-rose/40 px-4 py-2 font-semibold text-rose transition hover:bg-rose hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                {isDeleting ? "Menghapus..." : "Hapus"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </Container>
      </div>
    </RequireAuth>
  );
}
