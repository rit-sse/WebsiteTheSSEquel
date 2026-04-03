"use client";

import Link from "next/link";
import { startTransition, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileCode2,
  PencilLine,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createConstitutionUnifiedDiff } from "@/lib/constitution/diff";
import {
  parseConstitutionSections,
  replaceConstitutionSection,
} from "@/lib/constitution/sections";
import type { ConstitutionFlatSection } from "@/lib/constitution/types";
import { ProposalDiffView } from "@/app/(main)/about/constitution/ProposalDiffView";
import { ProposalStatusBadge } from "@/app/(main)/about/constitution/ProposalStatusBadge";

type EditableProposal = {
  id: number;
  title: string;
  summary: string;
  rationale: string;
  computedStatus?: string;
  sectionHeadingPath: string;
  proposedSectionMarkdown: string;
};

type AuthShape = {
  isUser: boolean;
  isMember: boolean;
  isOfficer: boolean;
};

function getDiffStats(diff: string) {
  return diff.split("\n").reduce(
    (acc, line) => {
      if (line.startsWith("+") && !line.startsWith("+++")) acc.added += 1;
      if (line.startsWith("-") && !line.startsWith("---")) acc.removed += 1;
      return acc;
    },
    { added: 0, removed: 0 }
  );
}

export function ConstitutionWorkbench({
  renderedHtml,
  baseMarkdown,
  baseSha,
  flatSections,
  auth,
  initialDraft,
}: {
  renderedHtml: string;
  baseMarkdown: string;
  baseSha: string;
  flatSections: ConstitutionFlatSection[];
  auth: AuthShape;
  initialDraft?: EditableProposal | null;
}) {
  const eligible = auth.isMember || auth.isOfficer;
  const initialSection =
    flatSections.find(
      (section) => section.path === initialDraft?.sectionHeadingPath
    ) ?? flatSections[0];
  const [draftId, setDraftId] = useState<number | null>(initialDraft?.id ?? null);
  const [title, setTitle] = useState(initialDraft?.title ?? "");
  const [summary, setSummary] = useState(initialDraft?.summary ?? "");
  const [rationale, setRationale] = useState(initialDraft?.rationale ?? "");
  const [sectionPath, setSectionPath] = useState(initialSection?.path ?? "");
  const [proposedSectionMarkdown, setProposedSectionMarkdown] = useState(
    initialDraft?.proposedSectionMarkdown ?? initialSection?.markdown ?? ""
  );
  const [isEditing, setIsEditing] = useState(Boolean(initialDraft));
  const [isSaving, setIsSaving] = useState(false);

  const selectedSection = useMemo(
    () => flatSections.find((section) => section.path === sectionPath) ?? null,
    [flatSections, sectionPath]
  );

  const validation = useMemo(() => {
    if (!selectedSection) {
      return {
        ok: false,
        parseStatus: "Missing section",
        fullProposedMarkdown: baseMarkdown,
        diff: "",
        stats: { added: 0, removed: 0 },
      };
    }

    try {
      const replacementSections = parseConstitutionSections(
        proposedSectionMarkdown
      ).flatSections;
      const firstReplacement = replacementSections[0];
      const headingMatches =
        firstReplacement &&
        firstReplacement.title === selectedSection.title &&
        firstReplacement.depth === selectedSection.depth;
      const fullProposedMarkdown = replaceConstitutionSection(
        baseMarkdown,
        selectedSection.path,
        proposedSectionMarkdown
      );
      const diff = createConstitutionUnifiedDiff(
        baseMarkdown,
        fullProposedMarkdown
      );

      return {
        ok:
          headingMatches &&
          proposedSectionMarkdown.trim() !== selectedSection.markdown.trim(),
        parseStatus: headingMatches
          ? "Heading verified"
          : "Heading mismatch",
        fullProposedMarkdown,
        diff,
        stats: getDiffStats(diff),
      };
    } catch {
      return {
        ok: false,
        parseStatus: "Markdown parse failed",
        fullProposedMarkdown: baseMarkdown,
        diff: "",
        stats: { added: 0, removed: 0 },
      };
    }
  }, [baseMarkdown, proposedSectionMarkdown, selectedSection]);

  const handleSectionChange = (nextPath: string) => {
    setSectionPath(nextPath);
    const nextSection = flatSections.find((section) => section.path === nextPath);
    if (nextSection) {
      startTransition(() => {
        setProposedSectionMarkdown(nextSection.markdown);
      });
    }
  };

  const submitProposal = async (action: "save" | "submit") => {
    if (!eligible) {
      toast.error("Only members and officers can propose amendments");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title,
        summary,
        rationale,
        sectionHeadingPath: sectionPath,
        proposedSectionMarkdown,
        action,
      };
      const url = draftId
        ? `/api/constitution/proposals/${draftId}`
        : "/api/constitution/proposals";
      const response = await fetch(url, {
        method: draftId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Failed to save proposal");
      }

      setDraftId(data.id);
      if (action === "submit") {
        setIsEditing(false);
      }
      toast.success(
        action === "submit"
          ? "Amendment submitted for primary review"
          : "Draft saved and patch generated"
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save amendment"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card depth={1} className="w-full p-0 overflow-hidden">
      <CardHeader className="border-b border-border/60 px-6 py-5 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
              Governing Document
            </div>
            <CardTitle className="mt-2 text-2xl">
              SSE Constitution
            </CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/about/constitution/dashboard">
                Proposal Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {eligible && !isEditing && (
              <Button size="sm" onClick={() => setIsEditing(true)}>
                <PencilLine className="h-4 w-4" />
                Propose Amendment
              </Button>
            )}
            {isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                <X className="h-4 w-4" />
                Close Editor
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {!isEditing ? (
        <CardContent className="px-6 py-6 md:px-8 md:py-8">
          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </CardContent>
      ) : (
        <CardContent className="space-y-6 px-6 py-6 md:px-8 md:py-8">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="constitution-title">Proposal Title</Label>
                <Input
                  id="constitution-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Amend Article II Section 3 voting procedure"
                  className="font-mono"
                  disabled={!eligible}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="constitution-summary">Summary</Label>
                <Input
                  id="constitution-summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder="One-line amendment summary"
                  className="font-mono"
                  disabled={!eligible}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="constitution-rationale">Rationale</Label>
                <Textarea
                  id="constitution-rationale"
                  value={rationale}
                  onChange={(event) => setRationale(event.target.value)}
                  placeholder="Explain why the constitution should change"
                  className="min-h-24 font-mono"
                  disabled={!eligible}
                />
              </div>
              <div className="grid gap-2">
                <Label>Target Section</Label>
                <Select
                  value={sectionPath}
                  onValueChange={handleSectionChange}
                  disabled={!eligible}
                >
                  <SelectTrigger className="font-mono">
                    <SelectValue placeholder="Choose a section" />
                  </SelectTrigger>
                  <SelectContent>
                    {flatSections.map((section) => (
                      <SelectItem key={section.path} value={section.path}>
                        {section.path}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border border-border/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.03),transparent_38%),linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(100,116,139,0.08)_1px,transparent_1px)] bg-[size:auto,22px_22px,22px_22px] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Inline Markdown Editor
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Editing raw markdown for <span className="font-mono">{sectionPath}</span>
                    </div>
                  </div>
                  {draftId ? (
                    <ProposalStatusBadge
                      status={initialDraft?.computedStatus ?? "DRAFT"}
                    />
                  ) : null}
                </div>
                <Textarea
                  id="constitution-patch"
                  value={proposedSectionMarkdown}
                  onChange={(event) =>
                    setProposedSectionMarkdown(event.target.value)
                  }
                  className="min-h-[420px] resize-y border-border/70 bg-background/90 font-mono text-xs"
                  disabled={!eligible}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-border/70 bg-background/80 p-4 font-mono text-xs">
                <div className="mb-2 flex items-center gap-2">
                  {validation.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  )}
                  <span className="uppercase tracking-[0.2em] text-muted-foreground">
                    Verification
                  </span>
                  {eligible ? (
                    <ShieldCheck className="ml-auto h-4 w-4 text-emerald-600" />
                  ) : null}
                </div>
                <div className="grid gap-1 text-muted-foreground">
                  <div>base_sha: {baseSha}</div>
                  <div>selected_path: {sectionPath || "unassigned"}</div>
                  <div>
                    eligibility: {eligible ? "member_or_officer" : "read_only"}
                  </div>
                  <div>heading_check: {validation.parseStatus}</div>
                  <div>
                    diff_lines: +{validation.stats.added} / -{validation.stats.removed}
                  </div>
                  <div>upstream_sync: locked_to_base_snapshot</div>
                </div>
              </div>

              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="patch">Patch</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="pt-3">
                  <div className="prose prose-sm max-w-none rounded-lg border border-border bg-background/70 p-4 dark:prose-invert">
                    <ReactMarkdown>{proposedSectionMarkdown}</ReactMarkdown>
                  </div>
                </TabsContent>
                <TabsContent value="patch" className="pt-3">
                  {validation.diff ? (
                    <ProposalDiffView diff={validation.diff} />
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      Save the draft to generate the stored patch.
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="metadata" className="pt-3">
                  <div className="rounded-lg border border-border bg-background/70 p-4 font-mono text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileCode2 className="h-4 w-4" />
                      proposal_meta.json
                    </div>
                    <pre className="mt-3 whitespace-pre-wrap">
                      {JSON.stringify(
                        {
                          draftId,
                          titleLength: title.length,
                          summaryLength: summary.length,
                          rationaleLength: rationale.length,
                          selectedSection: sectionPath,
                          validation: validation.parseStatus,
                          diff: validation.stats,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => submitProposal("save")}
                  disabled={!eligible || isSaving}
                >
                  {isSaving ? "Saving..." : draftId ? "Update Draft" : "Save Draft"}
                </Button>
                <Button
                  type="button"
                  onClick={() => submitProposal("submit")}
                  disabled={!eligible || isSaving}
                >
                  Submit for Primary Review
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
