"use client";

import { useDeferredValue, useMemo, useState } from "react";
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
import { FORM_COLLAB_ROLLOUT_ENABLED } from "@/features/forms/collab/rollout";
import DashboardHeader from "@/widgets/dashboard/DashboardHeader";
import DashboardMobileNav from "@/widgets/dashboard/DashboardMobileNav";
import DashboardSidebar from "@/widgets/dashboard/DashboardSidebar";
import { ApiError } from "@/shared/api/client";
import { formsApi, type FormSummary } from "@/shared/api/forms";

type SortType = "newest" | "oldest";
type FilterType = "all" | "draft" | "published";
type DisplayStatus = "draft" | "published" | "closed";

export default function DashboardFormsPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [deleteTarget, setDeleteTarget] = useState<FormSummary | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const searchKeyword = deferredQuery.trim();

  const { data, isLoading, isFetching, error: queryError } = useQuery({
    queryKey: ["forms", "mine", { search: searchKeyword, filter, sort }],
    queryFn: () => formsApi.list({ search: searchKeyword || undefined, status: filter, sort }),
    placeholderData: (previous) => previous,
  });
  const {
    data: sharedData,
    isLoading: isSharedLoading,
    isFetching: isSharedFetching,
    error: sharedQueryError,
  } = useQuery({
    queryKey: ["forms", "collaborations", { search: searchKeyword, filter, sort }],
    queryFn: () =>
      formsApi.listCollaborations({ search: searchKeyword || undefined, status: filter, sort }),
    placeholderData: (previous) => previous,
    enabled: FORM_COLLAB_ROLLOUT_ENABLED,
  });

  const forms = useMemo(() => data?.data ?? [], [data]);
  const sharedForms = useMemo(() => sharedData?.data ?? [], [sharedData]);
  const errorMessage =
    error ??
    (queryError
      ? queryError instanceof ApiError
        ? queryError.message
        : "Failed to load forms"
      : null);
  const sharedErrorMessage = useMemo(() => {
    if (!FORM_COLLAB_ROLLOUT_ENABLED || !sharedQueryError) return null;
    if (sharedQueryError instanceof ApiError && sharedQueryError.status === 404) {
      return "Collaboration dashboard is not available yet (check ENABLE_FORM_COLLAB on the backend).";
    }
    return sharedQueryError instanceof ApiError
      ? sharedQueryError.message
      : "Failed to load collaboration forms";
  }, [sharedQueryError]);


  const toDisplayedForms = (items: FormSummary[]) => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    return items.map((form) => ({
      ...form,
      status: (form.isClosed ? "closed" : form.isPublished ? "published" : "draft") as DisplayStatus,
      updatedLabel: formatter.format(new Date(form.updatedAt)),
    }));
  };

  const displayedForms = useMemo(() => toDisplayedForms(forms), [forms]);
  const displayedSharedForms = useMemo(() => toDisplayedForms(sharedForms), [sharedForms]);

  const handleDeleteForm = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    try {
      await formsApi.remove(deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ["forms", "mine"] });
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

            <main className="flex-1 space-y-6 px-6 py-8 pb-24">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-accent">Forms</p>
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
              {!isLoading && isFetching ? (
                <Card className="text-sm text-ink-muted">Updating forms...</Card>
              ) : null}
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
                      <div className="mb-2 space-y-2">
                        <h2 className="line-clamp-1 min-w-0 text-base font-semibold">{form.title}</h2>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="owned" className="px-2 py-0.5 text-[9px] tracking-[0.14em]">
                            Owned
                          </Badge>
                          <Badge
                            variant={
                              form.status === "closed"
                                ? "closed"
                                : form.status === "published"
                                  ? "published"
                                  : "draft"
                            }
                            className="px-2 py-0.5 text-[9px] tracking-[0.14em]"
                          >
                            {form.status}
                          </Badge>
                          {form.status !== "draft" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1 px-2 text-[11px]"
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

              {FORM_COLLAB_ROLLOUT_ENABLED ? (
                <section className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-sky-700">
                        Collaboration
                      </p>
                      <h3 className="mt-1 text-xl font-semibold">Invited Forms (Editor)</h3>
                      <p className="text-sm text-ink-muted">
                        Only forms where you were invited as an editor.
                      </p>
                    </div>
                  </div>

                  {isSharedLoading ? (
                    <Card className="text-sm text-ink-muted">Loading collaboration forms...</Card>
                  ) : null}
                  {!isSharedLoading && isSharedFetching ? (
                    <Card className="text-sm text-ink-muted">
                      Updating collaboration forms...
                    </Card>
                  ) : null}
                  {sharedErrorMessage ? (
                    <Card className="border-rose/40 bg-rose/10 text-sm text-rose">
                      {sharedErrorMessage}
                    </Card>
                  ) : null}
                  {!isSharedLoading && !sharedErrorMessage && displayedSharedForms.length === 0 ? (
                    <Card className="text-sm text-ink-muted">
                      No collaboration forms found.
                    </Card>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {displayedSharedForms.map((form) => (
                      <Card key={`shared-${form.id}`} className="flex h-full flex-col justify-between gap-4 p-5">
                        <div>
                          <div className="mb-2 space-y-2">
                            <h2 className="line-clamp-1 min-w-0 text-base font-semibold">{form.title}</h2>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant="collab" className="px-2 py-0.5 text-[9px] tracking-[0.14em]">
                                Collaborator
                              </Badge>
                              <Badge
                                variant={
                                  form.status === "closed"
                                    ? "closed"
                                    : form.status === "published"
                                      ? "published"
                                      : "draft"
                                }
                                className="px-2 py-0.5 text-[9px] tracking-[0.14em]"
                              >
                                {form.status}
                              </Badge>
                              {form.status !== "draft" ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 gap-1 px-2 text-[11px]"
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
                          <p className="text-xs text-ink-muted">
                            Owner: {form.owner?.name || form.owner?.email || "Unknown"}
                          </p>
                          <p className="text-xs text-ink-muted">Last edited: {form.updatedLabel}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Link href={`/forms/${form.id}/edit`}>
                              <Button size="sm" variant="secondary">Edit</Button>
                            </Link>
                            <Link href={`/forms/${form.id}/view`}>
                              <Button size="sm" variant="ghost">View</Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              ) : null}
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
        <DashboardMobileNav />
      </div>
    </RequireAuth>
  );
}
