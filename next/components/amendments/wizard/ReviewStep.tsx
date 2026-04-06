"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DiffViewer from "@/components/amendments/DiffViewer";

type ReviewStepProps = {
  originalContent: string;
  proposedContent: string;
  onBack: () => void;
  onNext: () => void;
};

export default function ReviewStep({
  originalContent,
  proposedContent,
  onBack,
  onNext,
}: ReviewStepProps) {
  return (
    <Card depth={2} className="p-4 sm:p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold">Review Your Changes</h2>
        <p className="text-sm text-muted-foreground">
          Review the diff below. Green lines are additions, red lines are
          removals. Make sure your changes accurately reflect your intended
          amendment.
        </p>
      </div>

      <DiffViewer
        originalContent={originalContent}
        proposedContent={proposedContent}
      />

      <div className="flex items-center justify-between gap-3">
        <Button variant="neutral" onClick={onBack}>
          Go Back &amp; Edit
        </Button>
        <Button onClick={onNext}>Looks Good</Button>
      </div>
    </Card>
  );
}
