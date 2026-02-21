import Link from "next/link";
import { Eye, Send } from "lucide-react";
import Button from "@/shared/ui/Button";
import Input from "@/shared/ui/Input";
import Textarea from "@/shared/ui/Textarea";

type SaveState = "idle" | "saving" | "saved" | "error";

type BuilderHeaderProps = Readonly<{
  title: string;
  description: string;
  saveState: SaveState;
  saveMessage: string;
  canPreview: boolean;
  previewHref: string;
  onChangeTitle: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onPublish: () => void;
  publishing: boolean;
}>;

export default function BuilderHeader({
  title,
  description,
  saveState,
  saveMessage,
  canPreview,
  previewHref,
  onChangeTitle,
  onChangeDescription,
  onPublish,
  publishing,
}: BuilderHeaderProps) {
  let indicatorClass = "text-ink-muted";
  if (saveState === "error") {
    indicatorClass = "text-rose";
  } else if (saveState === "saving") {
    indicatorClass = "text-sun";
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-page/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-4 md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="w-full max-w-2xl space-y-3">
            <Input
              value={title}
              onChange={(event) => onChangeTitle(event.target.value)}
              className="h-12 border-none bg-transparent px-0 text-2xl font-semibold text-ink shadow-none focus:border-none"
              placeholder="Form title"
            />
            <Textarea
              value={description}
              onChange={(event) => onChangeDescription(event.target.value)}
              className="min-h-14 resize-none border-none bg-transparent px-0 py-0 text-sm text-ink-muted shadow-none focus:border-none"
              placeholder="Form description"
            />
          </div>
          <div className="flex items-center gap-2 self-end md:self-start">
            {canPreview ? (
              <Link href={previewHref}>
                <Button variant="secondary" size="md" className="gap-2">
                  <Eye size={16} />
                  Preview
                </Button>
              </Link>
            ) : (
              <Button variant="secondary" size="md" className="gap-2" disabled>
                <Eye size={16} />
                Preview
              </Button>
            )}
            <Button onClick={onPublish} size="md" className="gap-2" disabled={publishing}>
              <Send size={16} />
              {publishing ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
        <p className={`text-xs ${indicatorClass}`}>{saveMessage}</p>
      </div>
    </header>
  );
}
