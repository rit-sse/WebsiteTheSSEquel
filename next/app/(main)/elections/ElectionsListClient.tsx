"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ElectionStatusBadge } from "@/components/elections/ElectionStatusBadge";
import { ElectionPhaseIndicator } from "@/components/elections/ElectionPhaseIndicator";
import { ElectionEmptyState } from "@/components/elections/ElectionEmptyState";
import { Vote, Users, Calendar, ChevronRight } from "lucide-react";
import type {
  ElectionNominationStatus,
  ElectionEligibilityStatus,
  ElectionStatus,
} from "@/components/elections/types";

/* ---------- Types ---------- */

interface ElectionOfficeItem {
  id: number;
  officerPosition: { id: number; title: string };
  nominations: {
    id: number;
    status: ElectionNominationStatus;
    eligibilityStatus: ElectionEligibilityStatus;
  }[];
}

interface ElectionItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  status: ElectionStatus;
  nominationsOpenAt: string;
  nominationsCloseAt: string;
  votingOpenAt: string;
  votingCloseAt: string;
  createdAt: string;
  offices: ElectionOfficeItem[];
}

/* ---------- Helpers ---------- */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getAcceptedCandidateCount(offices: ElectionOfficeItem[]): number {
  return offices.reduce(
    (total, office) =>
      total + office.nominations.filter((n) => n.status === "ACCEPTED").length,
    0
  );
}

function getTotalNominationCount(offices: ElectionOfficeItem[]): number {
  return offices.reduce(
    (total, office) => total + office.nominations.length,
    0
  );
}

/* ---------- ElectionRow ---------- */

function ElectionRow({ election }: { election: ElectionItem }) {
  const acceptedCandidates = getAcceptedCandidateCount(election.offices);
  const totalNominations = getTotalNominationCount(election.offices);

  return (
    <Link
      href={`/elections/${election.slug}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
    >
      <Card
        depth={2}
        className="overflow-hidden hover:scale-[1.005] transition-all duration-200"
      >
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-display font-bold">
                  {election.title}
                </h2>
                <ElectionStatusBadge status={election.status} />
              </div>

              {election.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {election.description}
                </p>
              )}

              <ElectionPhaseIndicator
                currentPhase={election.status}
                compact={false}
              />

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Vote className="h-3.5 w-3.5" />
                  {acceptedCandidates} candidate
                  {acceptedCandidates !== 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {totalNominations} nomination
                  {totalNominations !== 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(election.votingOpenAt)} &ndash;{" "}
                  {formatDate(election.votingCloseAt)}
                </span>
              </div>

              {election.offices.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {election.offices.map((office) => (
                    <Badge
                      key={office.id}
                      variant="outline"
                      className="text-xs"
                    >
                      {office.officerPosition.title}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0 hidden sm:block mt-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/* ---------- ElectionsListClient ---------- */

interface ElectionsListClientProps {
  elections: ElectionItem[];
}

export function ElectionsListClient({ elections }: ElectionsListClientProps) {
  if (elections.length === 0) {
    return (
      <ElectionEmptyState
        title="No elections yet"
        description="Elections will appear here when they are created. Check back during election season!"
      />
    );
  }

  return (
    <div className="space-y-4">
      {elections.map((election) => (
        <ElectionRow key={election.id} election={election} />
      ))}
    </div>
  );
}
