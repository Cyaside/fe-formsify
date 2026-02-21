"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import { apiRequest, ApiError } from "@/lib/api";

type FormThankYou = {
  id: string;
  thankYouTitle?: string | null;
  thankYouMessage?: string | null;
};

const DEFAULT_THANK_YOU_TITLE = "Terima kasih!";
const DEFAULT_THANK_YOU_MESSAGE = "Respons kamu sudah terekam.";

export default function SubmissionThankYouPage() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const invalidFormId = !formId;

  const [form, setForm] = useState<FormThankYou | null>(null);
  const [loading, setLoading] = useState(Boolean(formId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!formId) return;

    apiRequest<{ data: FormThankYou }>(`/api/forms/${formId}`)
      .then((response) => {
        setForm(response.data);
      })
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Failed to load form";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [formId]);

  return (
    <div className="min-h-screen bg-page py-12 text-ink">
      <Container className="max-w-xl">
        {invalidFormId ? (
          <Card className="border-rose/40 bg-rose/10 text-sm text-rose">Invalid form ID</Card>
        ) : null}
        {loading ? <Card className="text-sm text-ink-muted">Loading...</Card> : null}
        {error ? <Card className="border-rose/40 bg-rose/10 text-sm text-rose">{error}</Card> : null}

        {!loading && !error ? (
          <Card className="space-y-3 border-l-4 border-l-lavender p-6 text-center">
            <h1 className="text-2xl font-semibold">{form?.thankYouTitle || DEFAULT_THANK_YOU_TITLE}</h1>
            <p className="text-sm text-ink-muted">{form?.thankYouMessage || DEFAULT_THANK_YOU_MESSAGE}</p>
            <div className="pt-2">
              <Link href="/form-list">
                <Button variant="secondary">Return to Forms List</Button>
              </Link>
            </div>
          </Card>
        ) : null}
      </Container>
    </div>
  );
}
