import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AmendmentStatusBadge from "@/components/amendments/AmendmentStatusBadge";
import DiffViewer from "@/components/amendments/DiffViewer";
import { ThumbsUp, ThumbsDown, Pen, ChevronRight } from "lucide-react";
import { AmendmentStatus } from "@prisma/client";

type AmendmentCardProps = {
  amendment: {
    id: number;
    title: string;
    description: string;
    status: AmendmentStatus;
    totalVotes: number;
    approveVotes: number;
    rejectVotes: number;
    originalContent?: string;
    proposedContent?: string;
    author?: {
      name: string | null;
    };
  };
  userVote?: boolean | null;
  isAuthor?: boolean;
  /** Render in a muted/compact style for withdrawn/rejected */
  muted?: boolean;
};

export default function AmendmentCard({
  amendment,
  userVote = null,
  isAuthor = false,
  muted = false,
}: AmendmentCardProps) {
  const isNewAmendment = amendment.status === "PRIMARY_REVIEW";
  const hasDiff =
    amendment.originalContent &&
    amendment.proposedContent &&
    amendment.originalContent !== amendment.proposedContent;

  return (
    <Link
      href={`/about/constitution/amendments/${amendment.id}`}
      className={`block group ${muted ? "opacity-60 hover:opacity-80" : ""}`}
    >
      <Card
        depth={2}
        className={`cursor-pointer transition-colors hover:bg-surface-3/30 ${muted ? "p-3" : "p-4 md:p-5"}`}
      >
        <CardHeader className="p-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle
                className={`group-hover:text-primary transition-colors leading-snug ${muted ? "text-sm" : "text-base sm:text-lg"}`}
              >
                {amendment.title}
              </CardTitle>
              <span className="mt-1 block text-xs text-muted-foreground sm:text-sm">
                by {amendment.author?.name ?? "Unknown"}
              </span>
            </div>
            <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:justify-end">
              {isNewAmendment && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/12 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  New
                </span>
              )}
              {isAuthor && (
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  <Pen className="h-2.5 w-2.5" />
                  Author
                </span>
              )}
              <AmendmentStatusBadge status={amendment.status} />
              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-primary/60 sm:ml-0" />
            </div>
          </div>
        </CardHeader>

        {!muted && (
          <CardContent className="p-0 pt-3 space-y-3">
            {amendment.description && (
              <p className="text-sm text-foreground/70 line-clamp-2 leading-relaxed">
                {amendment.description}
              </p>
            )}

            {/* Inline diff preview */}
            {hasDiff && (
              <div className="max-h-[160px] overflow-hidden rounded-md border border-border/30 relative">
                <DiffViewer
                  originalContent={amendment.originalContent!}
                  proposedContent={amendment.proposedContent!}
                />
                {/* Fade overlay */}
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface-2 to-transparent pointer-events-none" />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="tabular-nums">{amendment.totalVotes} votes</span>
              <span className="text-emerald-700 dark:text-emerald-300 tabular-nums">
                {amendment.approveVotes} approve
              </span>
              <span className="text-rose-700 dark:text-rose-300 tabular-nums">
                {amendment.rejectVotes} reject
              </span>

              {userVote !== null && userVote !== undefined && (
                <span
                  className={`ml-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold ${
                    userVote
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                  }`}
                >
                  {userVote ? (
                    <ThumbsUp className="h-3 w-3" />
                  ) : (
                    <ThumbsDown className="h-3 w-3" />
                  )}
                  Your vote
                </span>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
