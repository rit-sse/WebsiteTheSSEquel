"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type EditorStepProps = {
  content: string;
  onChange: (content: string) => void;
  originalContent: string;
  onNext: () => void;
};

export default function EditorStep({
  content,
  onChange,
  originalContent,
  onNext,
}: EditorStepProps) {
  const hasChanges = content !== originalContent;

  return (
    <Card depth={2} className="p-4 sm:p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold">Edit the Constitution</h2>
        <p className="text-sm text-muted-foreground">
          Make your proposed changes to the constitution text below. The current
          text has been loaded from the official governing documents repository.
        </p>
      </div>

      <Textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        rows={20}
        className="font-mono text-sm resize-y min-h-[300px]"
        placeholder="Loading constitution text..."
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {hasChanges ? (
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              Changes detected
            </span>
          ) : (
            "No changes yet — edit the text above"
          )}
        </p>
        <Button onClick={onNext} disabled={!hasChanges}>
          Review Changes
        </Button>
      </div>
    </Card>
  );
}
