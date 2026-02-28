"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import Card from "@/shared/ui/Card";
import Container from "@/shared/ui/Container";
import { ApiError } from "@/shared/api/client";
import { formsApi, type FormDetail, type Question, type Section } from "@/shared/api/forms";

export default function FormPreviewPage({
  initialFormId,
}: Readonly<{
  initialFormId?: string;
}>) {
  const textAnswerMaxChar = 5000;
  const searchParams = useSearchParams();
  const formId = initialFormId;
  const returnTo = searchParams.get("returnTo") === "builder" && formId
    ? `/forms/${formId}/edit`
    : "/dashboard/forms";

  const [form, setForm] = useState<FormDetail | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!formId) return;

    Promise.all([
      formsApi.detail(formId),
      formsApi.questions(formId),
      formsApi.sections(formId),
    ])
      .then(([formResponse, questionResponse, sectionsResponse]) => {
        setForm(formResponse.data);
        setQuestions(questionResponse.data.toSorted((a, b) => a.order - b.order));
        setSections(sectionsResponse.data.toSorted((a, b) => a.order - b.order));
      })
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Failed to load preview";
        setError(message);
      });
  }, [formId]);

  const formattedQuestions = useMemo(() => {
    return questions.map((question) => ({
      ...question,
      options: question.options.toSorted((a, b) => a.order - b.order),
    }));
  }, [questions]);

  const orderedSections = useMemo(
    () => sections.toSorted((a, b) => a.order - b.order),
    [sections],
  );

  const sectionPages = useMemo(() => {
    if (orderedSections.length === 0) {
      return [{ section: null, questions: formattedQuestions }];
    }
    return orderedSections.map((section) => ({
      section,
      questions: formattedQuestions.filter((question) => question.sectionId === section.id),
    }));
  }, [formattedQuestions, orderedSections]);

  return (
    <div className="min-h-screen bg-page py-8 text-ink">
      <Container className="max-w-4xl space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Link href={returnTo}>
            <Button variant="secondary">Back</Button>
          </Link>
          <div className="flex items-center gap-2">
            {formId ? (
              <>
                <Button size="sm">Form</Button>
                <Link href={`/forms/${formId}/responses`}>
                  <Button variant="ghost" size="sm">Responses</Button>
                </Link>
                <Link href={`/forms/${formId}/summary`}>
                  <Button variant="ghost" size="sm">Summary</Button>
                </Link>
              </>
            ) : null}
            <Badge variant="muted">Preview only</Badge>
          </div>
        </div>

        {error ? <Card className="border-rose/40 bg-rose/10 text-sm text-rose">{error}</Card> : null}

        {form ? (
          <>
            <Card className="border-l-4 border-l-accent p-6">
              <h1 className="text-2xl font-semibold">{form.title}</h1>
              <p className="mt-2 text-sm text-ink-muted">{form.description || "No description"}</p>
            </Card>

            {formattedQuestions.length === 0 ? (
              <Card className="text-sm text-ink-muted">No questions yet.</Card>
            ) : (
              <div className="space-y-6">
                {sectionPages.map((page, sectionIndex) => (
                  <div key={page.section?.id ?? `section-${sectionIndex}`} className="space-y-3">
                    {page.section ? (
                      <Card className="border-dashed border-border/70 p-4">
                        <p className="text-xs text-ink-muted">
                          Section {sectionIndex + 1} of {sectionPages.length}
                        </p>
                        <h2 className="text-lg font-semibold">{page.section.title}</h2>
                        <p className="text-sm text-ink-muted">
                          {page.section.description || "No section description"}
                        </p>
                      </Card>
                    ) : null}

                    {page.questions.length === 0 ? (
                      <Card className="text-sm text-ink-muted">
                        No questions in this section yet.
                      </Card>
                    ) : (
                      page.questions.map((question, index) => (
                        <Card key={question.id} className="space-y-3 p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h2 className="text-base font-medium">
                                {index + 1}. {question.title}
                              </h2>
                              {question.description ? (
                                <p className="mt-1 text-sm text-ink-muted">{question.description}</p>
                              ) : null}
                            </div>
                            {question.required ? <Badge variant="draft">Required</Badge> : null}
                          </div>

                          {question.options.length > 0 ? (
                            <ul className="list-disc space-y-1 pl-4 text-sm text-ink-muted">
                              {question.options.map((option) => (
                                <li key={option.id}>{option.label}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-ink-muted">
                              {question.type === "SHORT_ANSWER"
                                ? `Short answer / paragraph (max ${textAnswerMaxChar.toLocaleString()} characters)`
                                : "Text response"}
                            </p>
                          )}
                        </Card>
                      ))
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </Container>
    </div>
  );
}
