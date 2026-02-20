"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Plus, Trash2 } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import DashboardHeader from "@/components/sections/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/sections/dashboard/DashboardSidebar";
import { apiRequest, ApiError } from "@/lib/api";
import { getFormStatusMap } from "@/lib/formPersistence";

type FormSummary = {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

type SortType = "newest" | "oldest";
type FilterType = "all" | "draft" | "published";

export default function DashboardFormsPage() {
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [deleteTarget, setDeleteTarget] = useState<FormSummary | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ data: FormSummary[] }>("/api/forms")
      .then((response) => {
        setForms(response.data);
      })
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Failed to load forms";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const displayedForms = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const statusMap = getFormStatusMap();

    return forms
      .map((form) => ({
        ...form,
        status: statusMap[form.id] ?? "draft",
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
      await apiRequest(`/api/forms/${deleteTarget.id}`, { method: "DELETE" });
      setForms((prev) => prev.filter((form) => form.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to delete form";
      setError(message);
    } finally {
      setDeletingId(null);
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

              {loading ? <Card className="text-sm text-ink-muted">Loading forms...</Card> : null}
              {error ? <Card className="border-rose/40 bg-rose/10 text-sm text-rose">{error}</Card> : null}
              {!loading && !error && displayedForms.length === 0 ? (
                <Card className="text-sm text-ink-muted">No forms found.</Card>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {displayedForms.map((form) => (
                  <Card key={form.id} className="flex h-full flex-col justify-between gap-4 p-5">
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <h2 className="line-clamp-1 text-base font-semibold">{form.title}</h2>
                        <Badge variant={form.status === "published" ? "published" : "draft"}>
                          {form.status}
                        </Badge>
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
