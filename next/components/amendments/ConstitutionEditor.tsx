"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import DiffViewer from "@/components/amendments/DiffViewer";

type EditorInput = {
  title: string;
  description: string;
  isSemanticChange: boolean;
  proposedContent: string;
};

export default function ConstitutionEditor({
  initialContent,
  onCancel,
}: {
  initialContent: string;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSemanticChange, setIsSemanticChange] = useState(true);
  const [proposedContent, setProposedContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasChanges = proposedContent !== initialContent;
  const preview = useMemo(
    () => ({
      title,
      description,
      isSemanticChange,
      proposedContent,
    }),
    [title, description, isSemanticChange, proposedContent],
  );

  async function submitProposal(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!hasChanges) {
      setError("Please change the constitution text before submitting");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/amendments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          isSemanticChange,
          proposedContent,
        } as EditorInput),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to submit amendment");
      }

      const payload = await response.json();
      const amendmentId = payload?.amendment?.id;
      if (!amendmentId) {
        throw new Error("Server did not return amendment id");
      }
      router.push(`/about/constitution/amendments/${amendmentId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit amendment";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <Card depth={2} className="p-4 sm:p-6 space-y-4">
      <CardHeader className="p-0">
        <CardTitle>Draft New Constitution Amendment</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        <form className="space-y-4" onSubmit={submitProposal}>
          <div className="space-y-2">
            <Label htmlFor="amendment-title">Amendment Title</Label>
            <Input
              id="amendment-title"
              placeholder="Short title for the amendment"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amendment-description">Description (optional)</Label>
            <Textarea
              id="amendment-description"
              placeholder="Why is this amendment needed?"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amendment-content">Proposed Constitution Text</Label>
            <Textarea
              id="amendment-content"
              value={proposedContent}
              onChange={(event) => setProposedContent(event.target.value)}
              rows={16}
              className="font-mono text-sm"
              disabled={loading}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isSemanticChange}
              onChange={(event) => setIsSemanticChange(event.target.checked)}
              disabled={loading}
            />
            This is a semantic change (full quorum + 2/3 supermajority voting).
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            {onCancel ? (
              <Button
                type="button"
                variant="neutral"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            ) : null}
            <Button type="submit" disabled={loading || !title.trim() || !hasChanges}>
              {loading ? "Submitting..." : "Submit Proposal"}
            </Button>
          </div>
        </form>

        <div className="space-y-2">
          <p className="text-sm font-medium">Live Diff Preview</p>
          <DiffViewer originalContent={initialContent} proposedContent={preview.proposedContent} />
        </div>

        <div className="rounded-md border border-border p-3 text-xs text-muted-foreground space-y-1">
          <p>
            <span className="font-semibold text-foreground">Ballot note:</span> If approved, the proposal should
            follow the constitutional rule:
            <span className="ml-1">Approve = finalizes amendment, Reject = keeps current text.</span>
          </p>
          <p>
            {isSemanticChange
              ? "Semantic changes require two-thirds of all members participating, and two-thirds of votes in favor."
              : "Non-semantic changes require primary officer consensus."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
