"use client";

import { useMemo } from "react";
import Card from "@/shared/ui/Card";
import type { QuestionType, ResponseAnswer } from "@/shared/api/forms";

type GroupedAnswer = {
  questionId: string;
  questionTitle: string;
  type: QuestionType;
  entries: string[];
};

const resolveAnswerEntry = (answer: ResponseAnswer) => {
  if (answer.question.type === "SHORT_ANSWER") {
    return answer.text?.trim() || "(empty)";
  }
  if (answer.optionId) {
    return (
      answer.question.options.find((option) => option.id === answer.optionId)?.label ||
      "(option removed)"
    );
  }
  return "-";
};

const groupAnswers = (answers: ResponseAnswer[]): GroupedAnswer[] => {
  const grouped = new Map<string, GroupedAnswer>();

  answers.forEach((answer) => {
    const key = answer.question.id;
    const existing = grouped.get(key) ?? {
      questionId: answer.question.id,
      questionTitle: answer.question.title,
      type: answer.question.type,
      entries: [],
    };

    existing.entries.push(resolveAnswerEntry(answer));
    grouped.set(key, existing);
  });

  return Array.from(grouped.values());
};

type ResponseAnswerCardsProps = Readonly<{
  answers: ResponseAnswer[];
  emptyMessage?: string;
}>;

export default function ResponseAnswerCards({
  answers,
  emptyMessage = "No answers in this response.",
}: ResponseAnswerCardsProps) {
  const groupedAnswers = useMemo(() => groupAnswers(answers), [answers]);

  if (groupedAnswers.length === 0) {
    return <Card className="text-sm text-ink-muted">{emptyMessage}</Card>;
  }

  return (
    <div className="space-y-3">
      {groupedAnswers.map((item) => (
        <Card key={item.questionId} className="space-y-2 p-5">
          <h2 className="text-base font-medium">{item.questionTitle}</h2>
          <ul className="list-disc space-y-1 pl-4 text-sm text-ink-muted">
            {item.entries.map((entry, entryIndex) => (
              <li key={`${item.questionId}-${entryIndex}`}>{entry}</li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
