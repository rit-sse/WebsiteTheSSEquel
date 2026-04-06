"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DiffViewer from "@/components/amendments/DiffViewer";

type ConfirmStepProps = {
  title: string;
  description: string;
  isSemanticChange: boolean;
  originalContent: string;
  proposedContent: string;
  loading: boolean;
  error: string;
  onBack: () => void;
  onSubmit: () => void;
};

export default function ConfirmStep({
  title,
  description,
  isSemanticChange,
  originalContent,
  proposedContent,
  loading,
  error,
  onBack,
  onSubmit,
}: ConfirmStepProps) {
  return (
    <Card depth={2} className="p-4 sm:p-6 space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold">Confirm &amp; Submit</h2>
        <p className="text-sm text-muted-foreground">
          Review your amendment one final time before submitting. This will
          create a pull request on the governing documents repository.
        </p>
      </div>

      {/* Summary */}
      <Card depth={3} className="p-4 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
            Title
          </p>
          <p className="font-display font-semibold text-lg">{title}</p>
        </div>
        {description && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
              Description
            </p>
            <p className="text-sm text-foreground/80">{description}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
            Change Type
          </p>
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
              isSemanticChange
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "bg-sky-500/10 text-sky-700 dark:text-sky-300"
            }`}
          >
            {isSemanticChange ? "Semantic change" : "Non-semantic change"}
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            {isSemanticChange
              ? "Requires 2/3 of all members participating, and 2/3 of votes in favor."
              : "Requires primary officer consensus."}
          </p>
        </div>
      </Card>

      {/* Compact diff preview */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Changes Preview</p>
        <div className="max-h-[200px] overflow-y-auto rounded-lg border border-border">
          <DiffViewer
            originalContent={originalContent}
            proposedContent={proposedContent}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <Button variant="neutral" onClick={onBack} disabled={loading}>
          Back to Details
        </Button>
        <Button onClick={onSubmit} disabled={loading}>
          {loading ? "Submitting..." : "Submit Proposal"}
        </Button>
      </div>

      <div className="rounded-md border border-border/40 p-3 text-xs text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">Note:</span>{" "}
          Submitting will create a GitHub pull request on the{" "}
          <code className="bg-surface-3 px-1 rounded">rit-sse/governing-docs</code>{" "}
          repository. The amendment will start as a draft and must be opened for
          public forum discussion before voting can begin.
        </p>
      </div>
    </Card>
  );
}
