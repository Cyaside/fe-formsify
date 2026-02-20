"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";

export default function FormResponsesPage() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return (
    <div className="min-h-screen bg-page py-8 text-ink">
      <Container className="max-w-3xl space-y-4">
        <Link href="/forms">
          <Button variant="secondary">Back to Forms</Button>
        </Link>
        <Card className="p-6">
          <h1 className="text-xl font-semibold">Responses</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Response analytics for form {formId ?? "-"} will be added in the next step.
          </p>
        </Card>
      </Container>
    </div>
  );
}
