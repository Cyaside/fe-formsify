"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import ThemeToggle from "@/shared/theme/ThemeToggle";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import Card from "@/shared/ui/Card";
import Container from "@/shared/ui/Container";
import Input from "@/shared/ui/Input";
import Select from "@/shared/ui/Select";
import { ApiError } from "@/shared/api/client";
import { formsApi } from "@/shared/api/forms";
import { useAuth } from "@/features/auth/AuthProvider";

type SortType = "newest" | "oldest";

export default function PublicFormListPage() {
  const { user, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [authorFilter, setAuthorFilter] = useState("all");
  const [sort, setSort] = useState<SortType>("newest");

  const { data, isLoading, error } = useQuery({
    queryKey: ["forms", "public"],
    queryFn: () => formsApi.listPublic(),
  });

  const forms = useMemo(() => data?.data ?? [], [data]);

  const errorMessage = useMemo(() => {
    if (!error) return null;
    return error instanceof ApiError ? error.message : "Failed to load public forms";
  }, [error]);

  const authorOptions = useMemo(() => {
    const labels = new Set(
      forms.map((form) => form.owner?.name || form.owner?.email || "Anonymous"),
    );
    return ["all", ...Array.from(labels).toSorted((a, b) => a.localeCompare(b))];
  }, [forms]);

  const displayedForms = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    return forms
      .map((form) => {
        const ownerLabel = form.owner?.name || form.owner?.email || "Anonymous";
        return {
          ...form,
          ownerLabel,
          updatedLabel: formatter.format(new Date(form.updatedAt)),
        };
      })
      .filter((form) => {
        if (authorFilter !== "all" && form.ownerLabel !== authorFilter) return false;
        const keyword = query.trim().toLowerCase();
        if (!keyword) return true;
        return (
          form.title.toLowerCase().includes(keyword) ||
          (form.description ?? "").toLowerCase().includes(keyword) ||
          form.ownerLabel.toLowerCase().includes(keyword)
        );
      })
      .sort((a, b) => {
        const left = new Date(a.updatedAt).getTime();
        const right = new Date(b.updatedAt).getTime();
        return sort === "newest" ? right - left : left - right;
      });
  }, [authorFilter, forms, query, sort]);

  return (
    <div className="min-h-screen bg-page text-ink">
      <section className="relative overflow-hidden bg-linear-to-b from-violet-deep via-violet/70 to-violet-deep">
        <Container className="relative py-16 md:py-20">
          <div className="absolute -left-12 top-8 h-44 w-44 rounded-full bg-lavender/20 blur-2xl" />
          <div className="absolute -right-10 bottom-4 h-52 w-52 rounded-full bg-rose/20 blur-2xl" />

          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-lavender">
              Public Directory
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              Forms List
            </h1>
            <p className="mt-3 text-sm text-ink-muted md:text-base">
              Explore public forms here and start building yours after signing in.
            </p>
          </div>

          <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-2">
            <Link href="/">
              <Button variant="secondary">Back to Landing Page</Button>
            </Link>
            {!authLoading && user ? (
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            ) : null}
            {!authLoading && !user ? (
              <>
                <Link href="/login">
                  <Button variant="secondary">Login</Button>
                </Link>
                <Link href="/register">
                  <Button>Register</Button>
                </Link>
              </>
            ) : null}
            <ThemeToggle />
          </div>
        </Container>

        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <svg
            viewBox="0 0 1440 220"
            preserveAspectRatio="none"
            className="h-16 w-full md:h-24"
            aria-hidden="true"
          >
            <path
              d="M0 140L120 120C240 100 480 60 720 80C960 100 1200 180 1320 190L1440 200V220H0Z"
              fill="var(--page-bg)"
            />
          </svg>
        </div>
      </section>

      <Container className="py-6">
        <Card className="mb-4 grid gap-3 p-4 md:grid-cols-[1fr_220px_180px]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search form"
          />
          <Select value={authorFilter} onChange={(event) => setAuthorFilter(event.target.value)}>
            {authorOptions.map((author) => (
              <option key={author} value={author}>
                {author === "all" ? "All Authors" : author}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => setSort((prev) => (prev === "newest" ? "oldest" : "newest"))}
          >
            <ArrowUpDown size={15} />
            {sort === "newest" ? "Newest" : "Oldest"}
          </Button>
        </Card>

        {isLoading ? <Card className="text-sm text-ink-muted">Loading public forms...</Card> : null}
        {errorMessage ? (
          <Card className="border-rose/40 bg-rose/10 text-sm text-rose">
            {errorMessage}
          </Card>
        ) : null}
        {!isLoading && !errorMessage && displayedForms.length === 0 ? (
          <Card className="text-sm text-ink-muted">No public forms found.</Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayedForms.map((form) => (
            <Card key={form.id} className="flex h-full flex-col justify-between gap-4 p-5">
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="line-clamp-1 text-base font-semibold">{form.title}</h2>
                  <Badge variant="muted">Read only</Badge>
                </div>
                <p className="line-clamp-3 text-sm text-ink-muted">
                  {form.description || "No description"}
                </p>
                <p className="mt-3 text-xs text-ink-muted">Author: {form.ownerLabel}</p>
              </div>

              <div>
                <p className="text-xs text-ink-muted">Last edited: {form.updatedLabel}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/form-list/${form.id}`}>
                    <Button size="sm" variant="secondary">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
}
