"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  RadixTooltip as Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

type DetailsStepProps = {
  title: string;
  description: string;
  isSemanticChange: boolean;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onSemanticChange: (v: boolean) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function DetailsStep({
  title,
  description,
  isSemanticChange,
  onTitleChange,
  onDescriptionChange,
  onSemanticChange,
  onBack,
  onNext,
}: DetailsStepProps) {
  const canProceed = title.trim().length > 0;

  return (
    <Card depth={2} className="p-4 sm:p-6 space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold">Amendment Details</h2>
        <p className="text-sm text-muted-foreground">
          Give your amendment a clear title and description so members understand
          what they&apos;re voting on.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amendment-title">Title *</Label>
          <Input
            id="amendment-title"
            placeholder="Short, descriptive title for the amendment"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amendment-description">Description</Label>
          <Textarea
            id="amendment-description"
            placeholder="Why is this amendment needed? What problem does it solve?"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Change Type</Label>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="font-semibold mb-1">Semantic vs. Non-semantic</p>
                  <p className="mb-2">
                    <strong>Semantic changes</strong> alter the meaning of the
                    constitution (e.g., changing rules, adding requirements).
                    They require a 2/3 quorum of all active members plus a 2/3
                    supermajority of votes cast.
                  </p>
                  <p>
                    <strong>Non-semantic changes</strong> are formatting fixes,
                    typo corrections, or structural clarifications that don&apos;t
                    change meaning. They require only primary officer consensus.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-surface-3/30 transition-colors">
            <input
              type="checkbox"
              checked={isSemanticChange}
              onChange={(e) => onSemanticChange(e.target.checked)}
              className="mt-0.5"
            />
            <div>
              <span className="text-sm font-medium">
                This is a semantic change
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isSemanticChange
                  ? "Requires 2/3 quorum + 2/3 supermajority to pass"
                  : "Requires primary officer consensus only"}
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button variant="neutral" onClick={onBack}>
          Back to Review
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Continue to Summary
        </Button>
      </div>
    </Card>
  );
}
