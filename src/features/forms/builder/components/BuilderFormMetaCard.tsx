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
  responseLimit: string;
  onChangeTitle: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeThankYouTitle: (value: string) => void;
  onChangeThankYouMessage: (value: string) => void;
  onChangeIsResponseClosed: (value: boolean) => void;
  onChangeResponseLimit: (value: string) => void;
}>;

export default function BuilderFormMetaCard({
  title,
  description,
  thankYouTitle,
  thankYouMessage,
  isResponseClosed,
  responseLimit,
  onChangeTitle,
  onChangeDescription,
  onChangeThankYouTitle,
  onChangeThankYouMessage,
  onChangeIsResponseClosed,
  onChangeResponseLimit,
}: BuilderFormMetaCardProps) {
  return (
    <Card className="mb-4 border-t-4 border-t-accent p-6">
      <div className="space-y-3">
        <Input
          value={title}
          onChange={(event) => onChangeTitle(event.target.value)}
          className="h-12 border-none bg-transparent px-0 text-3xl font-semibold shadow-none focus:border-none"
          placeholder="Form title"
        />
        <Textarea
          value={description}
          onChange={(event) => onChangeDescription(event.target.value)}
          className="min-h-20 resize-none border-none bg-transparent px-0 py-0 text-sm text-ink-muted shadow-none focus:border-none"
          placeholder="Form description"
        />
        <div className="grid gap-3 border-t border-border/60 pt-3 md:grid-cols-2">
          <Input
            value={thankYouTitle}
            onChange={(event) => onChangeThankYouTitle(event.target.value)}
            placeholder="Thank you title"
          />
          <Textarea
            value={thankYouMessage}
            onChange={(event) => onChangeThankYouMessage(event.target.value)}
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
              className="h-4 w-4 accent-accent"
            />
            <span>Tutup respons (manual close)</span>
          </label>
          <Input
            type="number"
            min={1}
            step={1}
            value={responseLimit}
            onChange={(event) => onChangeResponseLimit(event.target.value)}
            placeholder="Response limit (kosong = tanpa batas)"
          />
        </div>
      </div>
    </Card>
  );
}
