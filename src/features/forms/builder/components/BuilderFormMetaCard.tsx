"use client";

import Card from "@/shared/ui/Card";
import Input from "@/shared/ui/Input";
import Textarea from "@/shared/ui/Textarea";

type BuilderFormMetaCardProps = Readonly<{
  title: string;
  description: string;
  thankYouTitle: string;
  thankYouMessage: string;
  isResponseClosed: boolean;
  isPublished: boolean;
  questionsLocked: boolean;
  responseLimit: string;
  onChangeTitle: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeThankYouTitle: (value: string) => void;
  onChangeThankYouMessage: (value: string) => void;
  onChangeIsResponseClosed: (value: boolean) => void;
  onChangeResponseLimit: (value: string) => void;
  onFieldFocus: (target: { kind: "form"; field: string }) => void;
  onFieldBlur: () => void;
  getEditorsLabel: (target: { kind: "form"; field: string }) => string | null;
}>;

function PresenceBadge({ label }: Readonly<{ label: string | null }>) {
  if (!label) return null;
  return (
    <p className="text-xs font-medium text-sky-700">
      Being edited by: {label}
    </p>
  );
}

export default function BuilderFormMetaCard({
  title,
  description,
  thankYouTitle,
  thankYouMessage,
  isResponseClosed,
  isPublished,
  questionsLocked,
  responseLimit,
  onChangeTitle,
  onChangeDescription,
  onChangeThankYouTitle,
  onChangeThankYouMessage,
  onChangeIsResponseClosed,
  onChangeResponseLimit,
  onFieldFocus,
  onFieldBlur,
  getEditorsLabel,
}: BuilderFormMetaCardProps) {
  return (
    <Card className="mb-4 border-t-4 border-t-accent p-6">
      <div className="space-y-3">
        <div className="space-y-1">
          <Input
            value={title}
            onChange={(event) => onChangeTitle(event.target.value)}
            onFocus={() => onFieldFocus({ kind: "form", field: "title" })}
            onBlur={onFieldBlur}
            disabled={questionsLocked}
            className="h-12 border-none bg-transparent px-0 text-3xl font-semibold shadow-none focus:border-none"
            placeholder="Form title"
          />
          <PresenceBadge label={getEditorsLabel({ kind: "form", field: "title" })} />
        </div>
        <div className="space-y-1">
          <Textarea
            value={description}
            onChange={(event) => onChangeDescription(event.target.value)}
            onFocus={() => onFieldFocus({ kind: "form", field: "description" })}
            onBlur={onFieldBlur}
            disabled={questionsLocked}
            className="min-h-20 resize-none border-none bg-transparent px-0 py-0 text-sm text-ink-muted shadow-none focus:border-none"
            placeholder="Form description"
          />
          <PresenceBadge label={getEditorsLabel({ kind: "form", field: "description" })} />
        </div>
        <div className="grid gap-3 border-t border-border/60 pt-3 md:grid-cols-2">
          <Input
            value={thankYouTitle}
            onChange={(event) => onChangeThankYouTitle(event.target.value)}
            disabled={questionsLocked}
            placeholder="Thank you title"
          />
          <Textarea
            value={thankYouMessage}
            onChange={(event) => onChangeThankYouMessage(event.target.value)}
            disabled={questionsLocked}
            className="min-h-11 resize-none"
            placeholder="Thank you message"
          />
        </div>
        <div className="grid gap-3 border-t border-border/60 pt-3 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={isResponseClosed}
              onChange={(event) => onChangeIsResponseClosed(event.target.checked)}
              disabled={!isPublished}
              className="h-4 w-4 accent-accent"
            />
            <span>{isPublished ? "Close responses (manual close)" : "Close (published forms only)"}</span>
          </label>
          <Input
            type="number"
            min={1}
            step={1}
            value={responseLimit}
            onChange={(event) => onChangeResponseLimit(event.target.value)}
            placeholder="Response limit (empty = no limit)"
          />
        </div>
      </div>
    </Card>
  );
}
