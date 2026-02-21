"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowUpDown, Copy, Plus, Trash2 } from "lucide-react";
import RequireAuth from "@/features/auth/RequireAuth";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import Card from "@/shared/ui/Card";
import Input from "@/shared/ui/Input";
import Modal from "@/shared/ui/Modal";
import Select from "@/shared/ui/Select";
import DashboardHeader from "@/widgets/dashboard/DashboardHeader";
import DashboardSidebar from "@/widgets/dashboard/DashboardSidebar";
import { ApiError } from "@/shared/api/client";
import { formsApi, type FormSummary } from "@/shared/api/forms";

type SortType = "newest" | "oldest";
type FilterType = "all" | "draft" | "published";

export default function DashboardFormsPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [deleteTarget, setDeleteTarget] = useState<FormSummary | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ["forms", "mine"],
    queryFn: () => formsApi.list(),
  });

  const forms = useMemo(() => data?.data ?? [], [data]);
  const errorMessage =
    error ??
    (queryError
      ? queryError instanceof ApiError
        ? queryError.message
        : "Failed to load forms"
      : null);


  const displayedForms = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    return forms
      .map((form) => ({
        ...form,
        status: form.isPublished ? "published" : "draft",
        updatedLabel: formatter.format(new Date(form.updatedAt)),
      }))
      .filter((form) => {
        if (filter !== "all" && form.status !== filter) return false;
        const keyword = query.trim().toLowerCase();
        if (!keyword) return true;
        return (
          form.title.toLowerCase().includes(keyword) ||
          (form.description ?? "").toLowerCase().includes(keyword)
        );
      })
      .sort((a, b) => {
        const left = new Date(a.updatedAt).getTime();
        const right = new Date(b.updatedAt).getTime();
        return sort === "newest" ? right - left : left - right;
      });
  }, [filter, forms, query, sort]);

  const handleDeleteForm = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    try {
      await formsApi.remove(deleteTarget.id);
      queryClient.setQueryData<{ data: FormSummary[] }>(["forms", "mine"], (prev) => {
        if (!prev) return prev;
        return { ...prev, data: prev.data.filter((form) => form.id !== deleteTarget.id) };
      });
      setDeleteTarget(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to delete form";
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyShareUrl = async (formId: string) => {
    try {
      const shareUrl = `${globalThis.location.origin}/share/${formId}`;
      await globalThis.navigator.clipboard.writeText(shareUrl);
      setCopiedShareId(formId);
      globalThis.setTimeout(() => {
        setCopiedShareId((current) => (current === formId ? null : current));
      }, 1800);
    } catch {
      setError("Failed to copy share URL");
    }
  };

  return (
    <RequireAuth>
      <div className="min-h-screen bg-page text-ink">
        <div className="flex min-h-screen">
          <DashboardSidebar />
          <div className="flex flex-1 flex-col">
            <DashboardHeader />

            <main className="flex-1 space-y-6 px-6 py-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-lavender">Forms</p>
                  <h2 className="mt-2 text-2xl font-semibold">Your Forms</h2>
                </div>
                <Link href="/forms/new">
                  <Button className="gap-2">
                    <Plus size={16} />
                    Create Form
                  </Button>
                </Link>
              </div>

              <Card className="grid gap-3 p-4 md:grid-cols-[1fr_180px_180px]">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search form"
                />
                <Select value={filter} onChange={(event) => setFilter(event.target.value as FilterType)}>
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </Select>
                <Button variant="secondary" className="gap-2" onClick={() => setSort((prev) => (prev === "newest" ? "oldest" : "newest"))}>
                  <ArrowUpDown size={15} />
                  {sort === "newest" ? "Newest" : "Oldest"}
                </Button>
              </Card>

              {isLoading ? <Card className="text-sm text-ink-muted">Loading forms...</Card> : null}
              {errorMessage ? (
                <Card className="border-rose/40 bg-rose/10 text-sm text-rose">
                  {errorMessage}
                </Card>
              ) : null}
              {!isLoading && !errorMessage && displayedForms.length === 0 ? (
                <Card className="text-sm text-ink-muted">No forms found.</Card>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {displayedForms.map((form) => (
                  <Card key={form.id} className="flex h-full flex-col justify-between gap-4 p-5">
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <h2 className="line-clamp-1 text-base font-semibold">{form.title}</h2>
                        <div className="flex items-center gap-2">
                          <Badge variant={form.status === "published" ? "published" : "draft"}>
                            {form.status}
                          </Badge>
                          {form.status === "published" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1"
                              onClick={() => handleCopyShareUrl(form.id)}
                            >
                              <Copy size={13} />
                              {copiedShareId === form.id ? "Copied" : "Share URL"}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      <p className="line-clamp-3 text-sm text-ink-muted">
                        {form.description || "No description"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-ink-muted">Last edited: {form.updatedLabel}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link href={`/forms/${form.id}/edit`}>
                          <Button size="sm" variant="secondary">Edit</Button>
                        </Link>
                        <Link href={`/forms/${form.id}/view`}>
                          <Button size="sm" variant="ghost">View</Button>
                        </Link>
                        <Link href={`/forms/${form.id}/responses`}>
                          <Button size="sm" variant="ghost">Responses</Button>
                        </Link>
                        <Link href={`/forms/${form.id}/summary`}>
                          <Button size="sm" variant="ghost">Summary</Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="danger"
                          className="gap-1.5"
                          onClick={() => setDeleteTarget(form)}
                          disabled={deletingId === form.id}
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </main>
          </div>
        </div>

        <Modal
          open={Boolean(deleteTarget)}
          title="Delete form"
          description={`Are you sure you want to delete "${deleteTarget?.title ?? ""}"?`}
          onClose={() => {
            if (deletingId) return;
            setDeleteTarget(null);
          }}
        >
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={Boolean(deletingId)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteForm} disabled={Boolean(deletingId)}>
              {deletingId ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </Modal>
      </div>
    </RequireAuth>
  );
}
