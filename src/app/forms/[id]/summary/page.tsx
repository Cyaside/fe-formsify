"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Button from "@/shared/ui/Button";
import Card from "@/shared/ui/Card";
import Container from "@/shared/ui/Container";
import { ApiError } from "@/shared/api/client";
import {
  formsApi,
  type Question,
  type QuestionType,
  type ResponseRecord,
  type ResponsesPayload,
} from "@/shared/api/forms";

type OptionSummary = {
  optionId: string;
  label: string;
  count: number;
  percent: number;
};

type QuestionSummary = {
  questionId: string;
  title: string;
  type: QuestionType;
  responseCount: number;
  options: OptionSummary[];
};

type ChartView = "bar" | "pie";

const formatPercent = (value: number) => `${Math.round(value)}%`;
const PIE_COLORS = [
  "#5B8FF9",
  "#61DDAA",
  "#65789B",
  "#F6BD16",
  "#7262FD",
  "#78D3F8",
  "#9661BC",
  "#F6903D",
  "#008685",
  "#F08BB4",
];

export default function FormSummaryPage() {
  const params = useParams();
  const formId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [form, setForm] = useState<ResponsesPayload["form"] | null>(null);
  const [responses, setResponses] = useState<ResponseRecord[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(Boolean(formId));
  const [error, setError] = useState<string | null>(null);
  const [chartViewByQuestion, setChartViewByQuestion] = useState<
    Record<string, ChartView>
  >({});

  useEffect(() => {
    if (!formId) return;

    Promise.all([
      formsApi.responses(formId),
      formsApi.questions(formId),
      formsApi.sections(formId),
    ])
      .then(([responsesPayload, questionsPayload, sectionsPayload]) => {
        setForm(responsesPayload.form);
        setResponses(responsesPayload.data);
        const sortedSections = sectionsPayload.data.toSorted((a, b) => a.order - b.order);
        const sectionOrderMap = new Map(
          sortedSections.map((section) => [section.id, section.order]),
        );
        setQuestions(
          questionsPayload.data.toSorted((a, b) => {
            const sectionOrderA = sectionOrderMap.get(a.sectionId) ?? 0;
            const sectionOrderB = sectionOrderMap.get(b.sectionId) ?? 0;
            if (sectionOrderA !== sectionOrderB) return sectionOrderA - sectionOrderB;
            return a.order - b.order;
          }),
        );
      })
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Failed to load summary";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [formId]);

  const questionSummaries = useMemo<QuestionSummary[]>(() => {
    return questions
      .filter((question) => question.type !== "SHORT_ANSWER")
      .map((question) => {
        const optionCounts = new Map<string, number>();
        question.options.forEach((option) => optionCounts.set(option.id, 0));

        responses.forEach((response) => {
          response.answers
            .filter((answer) => answer.questionId === question.id && answer.optionId)
            .forEach((answer) => {
              const optionId = answer.optionId as string;
              optionCounts.set(optionId, (optionCounts.get(optionId) ?? 0) + 1);
            });
        });

        const totalSelections = Array.from(optionCounts.values()).reduce((sum, value) => sum + value, 0);

        const options = question.options
          .toSorted((a, b) => a.order - b.order)
          .map((option) => {
            const count = optionCounts.get(option.id) ?? 0;
            return {
              optionId: option.id,
              label: option.label,
              count,
              percent: totalSelections > 0 ? (count / totalSelections) * 100 : 0,
            };
          });

        return {
          questionId: question.id,
          title: question.title,
          type: question.type,
          responseCount: totalSelections,
          options,
        };
      });
  }, [questions, responses]);

  const shortAnswerSummary = useMemo(() => {
    return questions
      .filter((question) => question.type === "SHORT_ANSWER")
      .map((question) => {
        const entries = responses
          .flatMap((response) => response.answers)
          .filter((answer) => answer.questionId === question.id)
          .map((answer) => answer.text?.trim())
          .filter((text): text is string => Boolean(text));

        return {
          questionId: question.id,
          title: question.title,
          entries,
        };
      });
  }, [questions, responses]);

  return (
    <div className="min-h-screen bg-page py-8 text-ink">
      <Container className="max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard/forms">
            <Button variant="secondary">Back to Forms</Button>
          </Link>
          <div className="flex items-center gap-2">
            {formId ? (
              <>
                <Link href={`/forms/${formId}/view`}>
                  <Button variant="ghost" size="sm">Form</Button>
                </Link>
                <Link href={`/forms/${formId}/responses`}>
                  <Button variant="ghost" size="sm">Responses</Button>
                </Link>
                <Button size="sm">Summary</Button>
              </>
            ) : null}
          </div>
        </div>

        {loading ? <Card className="text-sm text-ink-muted">Loading summary...</Card> : null}
        {error ? <Card className="border-rose/40 bg-rose/10 text-sm text-rose">{error}</Card> : null}

        {form ? (
          <Card className="space-y-2 border-l-4 border-l-accent p-6">
            <h1 className="text-2xl font-semibold">{form.title}</h1>
            <p className="text-sm text-ink-muted">{form.description || "No description"}</p>
            <p className="text-xs text-ink-muted">{responses.length} responses</p>
          </Card>
        ) : null}

        {!loading && !error && questionSummaries.length === 0 && shortAnswerSummary.length === 0 ? (
          <Card className="text-sm text-ink-muted">No questions available for summary.</Card>
        ) : null}

        {questionSummaries.map((summary) => {
          const chartData = summary.options.map((option) => ({
            label: option.label,
            count: option.count,
            percent: formatPercent(option.percent),
          }));
          const chartView = chartViewByQuestion[summary.questionId] ?? "bar";

          return (
            <Card key={summary.questionId} className="space-y-4 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold">{summary.title}</h2>
                  <p className="text-sm text-ink-muted">{summary.responseCount} selections</p>
                </div>
                <div className="inline-flex rounded-xl border border-border bg-surface p-1">
                  <Button
                    size="sm"
                    variant={chartView === "bar" ? "primary" : "ghost"}
                    className="h-8 rounded-lg px-3"
                    onClick={() =>
                      setChartViewByQuestion((prev) => ({
                        ...prev,
                        [summary.questionId]: "bar",
                      }))
                    }
                  >
                    Bar
                  </Button>
                  <Button
                    size="sm"
                    variant={chartView === "pie" ? "primary" : "ghost"}
                    className="h-8 rounded-lg px-3"
                    onClick={() =>
                      setChartViewByQuestion((prev) => ({
                        ...prev,
                        [summary.questionId]: "pie",
                      }))
                    }
                  >
                    Pie
                  </Button>
                </div>
              </div>

              <div className="h-64 w-full">
                {chartView === "pie" ? (
                  summary.responseCount === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-xl border border-border bg-surface-2 text-sm text-ink-muted">
                      No selections yet for pie chart.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="count"
                          nameKey="label"
                          innerRadius={55}
                          outerRadius={95}
                          paddingAngle={2}
                        >
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`${summary.questionId}-${entry.label}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                              stroke="var(--background)"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, _label, payload) => {
                            const safeValue = typeof value === "number" ? value : 0;
                            const percent = payload?.payload?.percent as string | undefined;
                            return [
                              safeValue,
                              percent ? `Responses (${percent})` : "Responses",
                            ];
                          }}
                          contentStyle={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                            color: "var(--ink)",
                            fontSize: 12,
                          }}
                          wrapperStyle={{ zIndex: 1000 }}
                          labelStyle={{ color: "var(--ink)", fontSize: 12, fontWeight: 600 }}
                          itemStyle={{ color: "var(--ink)", fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 12 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                        width={120}
                      />
                      <Tooltip
                        formatter={(value, _label, payload) => {
                          const safeValue = typeof value === "number" ? value : 0;
                          const percent = payload?.payload?.percent as string | undefined;
                          return [
                            safeValue,
                            percent ? `Responses (${percent})` : "Responses",
                          ];
                        }}
                        contentStyle={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          color: "var(--ink)",
                          fontSize: 12,
                        }}
                        wrapperStyle={{ zIndex: 1000 }}
                        labelStyle={{ color: "var(--ink)", fontSize: 12, fontWeight: 600 }}
                        itemStyle={{ color: "var(--ink)", fontSize: 12 }}
                      />
                      <Bar dataKey="count" fill="var(--lavender)" radius={[8, 8, 8, 8]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="space-y-2 text-sm text-ink-muted">
                {summary.options.map((option) => (
                  <div key={option.optionId} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      {chartView === "pie" ? (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              PIE_COLORS[
                                summary.options.findIndex((item) => item.optionId === option.optionId) %
                                  PIE_COLORS.length
                              ],
                          }}
                        />
                      ) : null}
                      <span>{option.label}</span>
                    </span>
                    <span>
                      {option.count} ({formatPercent(option.percent)})
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}

        {shortAnswerSummary.map((summary) => (
          <Card key={summary.questionId} className="space-y-3 p-5">
            <div>
              <h2 className="text-base font-semibold">{summary.title}</h2>
              <p className="text-sm text-ink-muted">{summary.entries.length} text responses</p>
            </div>

            {summary.entries.length === 0 ? (
              <p className="text-sm text-ink-muted">No answers yet.</p>
            ) : (
              <div className="space-y-2">
                {summary.entries.slice(0, 10).map((entry, index) => (
                  <p key={`${summary.questionId}-${index}`} className="rounded-xl bg-surface-2 px-3 py-2 text-sm text-ink-muted">
                    {entry}
                  </p>
                ))}
              </div>
            )}
          </Card>
        ))}
      </Container>
    </div>
  );
}
