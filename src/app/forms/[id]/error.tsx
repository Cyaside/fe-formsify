"use client";

import { useEffect } from "react";
import Button from "@/shared/ui/Button";
import Card from "@/shared/ui/Card";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-page px-6 py-8 text-ink">
      <Card className="space-y-3 border-rose/40 bg-rose/10 text-sm text-rose">
        <p>We could not load this form view.</p>
        <Button variant="secondary" onClick={reset}>
          Try again
        </Button>
      </Card>
    </div>
  );
}
