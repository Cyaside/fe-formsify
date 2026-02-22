"use client";

import Card from "@/shared/ui/Card";
import Input from "@/shared/ui/Input";
import Textarea from "@/shared/ui/Textarea";

type BuilderFormMetaCardProps = Readonly<{
  title: string;
  description: string;
  thankYouTitle: string;
  thankYouMessage: string;
  onChangeTitle: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeThankYouTitle: (value: string) => void;
  onChangeThankYouMessage: (value: string) => void;
}>;

export default function BuilderFormMetaCard({
  title,
  description,
  thankYouTitle,
  thankYouMessage,
  onChangeTitle,
  onChangeDescription,
  onChangeThankYouTitle,
  onChangeThankYouMessage,
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
      </div>
    </Card>
  );
}
