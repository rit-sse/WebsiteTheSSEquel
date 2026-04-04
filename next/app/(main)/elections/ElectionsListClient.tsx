"use client";

import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ElectionStatusBadge } from "@/components/elections/ElectionStatusBadge";
import { ElectionPhaseIndicator } from "@/components/elections/ElectionPhaseIndicator";
import { ElectionEmptyState } from "@/components/elections/ElectionEmptyState";
import { Vote, Users, Calendar, ChevronRight } from "lucide-react";
import type {
  ElectionStatus,
  ElectionNominationStatus,
  ElectionEligibilityStatus,
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

type TabValue = "active" | "upcoming" | "past" | "all";

/* ---------- Helpers ---------- */

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }) +
    ", " +
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
}

function filterElections(
  elections: ElectionItem[],
  tab: TabValue
): ElectionItem[] {
  switch (tab) {
    case "active":
      return elections.filter(
        (e) => e.status === "NOMINATIONS_OPEN" || e.status === "VOTING_OPEN"
      );
    case "upcoming":
      return elections.filter((e) => e.status === "NOMINATIONS_CLOSED");
    case "past":
      return elections.filter(
        (e) => e.status === "VOTING_CLOSED" || e.status === "CERTIFIED"
      );
    case "all":
    default:
      return elections;
  }
}

function getAcceptedCandidateCount(offices: ElectionOfficeItem[]): number {
  return offices.reduce(
    (total, office) =>
      total +
      office.nominations.filter((n) => n.status === "ACCEPTED").length,
    0
  );
}

function getTotalNominationCount(offices: ElectionOfficeItem[]): number {
  return offices.reduce(
    (total, office) => total + office.nominations.length,
    0
  );
}

const TAB_EMPTY_MESSAGES: Record<
  TabValue,
  { title: string; description: string }
> = {
  active: {
    title: "No active elections",
    description:
      "There are no elections currently accepting nominations or votes. Check back soon!",
  },
  upcoming: {
    title: "No upcoming elections",
    description:
      "There are no elections awaiting ballot approval right now.",
  },
  past: {
    title: "No past elections",
    description:
      "Completed elections will appear here once voting has closed.",
  },
  all: {
    title: "No elections yet",
    description:
      "Elections will appear here when they are created. Check back during election season!",
  },
};

/* ---------- ElectionCard ---------- */

function ElectionCard({ election }: { election: ElectionItem }) {
  const acceptedCandidates = getAcceptedCandidateCount(election.offices);
  const totalNominations = getTotalNominationCount(election.offices);

  return (
    <Link
      href={`/elections/${election.slug}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
    >
      <Card
        depth={2}
        className="relative h-full overflow-hidden hover:scale-[1.02] transition-all duration-200"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="font-display font-bold line-clamp-2">
              {election.title}
            </CardTitle>
            <ElectionStatusBadge
              status={election.status}
              className="shrink-0"
            />
          </div>
          {election.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {election.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Phase indicator */}
          <ElectionPhaseIndicator
            currentPhase={election.status}
            compact={true}
          />

          {/* Position chips */}
          {election.offices.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {election.offices.map((office) => (
                <Badge key={office.id} variant="outline" className="text-xs">
                  {office.officerPosition.title}
                </Badge>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Vote className="h-3.5 w-3.5" />
              <span>
                {acceptedCandidates} candidate{acceptedCandidates !== 1 ? "s" : ""}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>
                {totalNominations} nomination{totalNominations !== 1 ? "s" : ""}
              </span>
            </span>
          </div>
        </CardContent>

        <CardFooter className="text-xs text-muted-foreground border-t border-border/10 pt-4">
          <div className="flex items-center justify-between w-full">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {formatDate(election.votingOpenAt)} &ndash;{" "}
                {formatDate(election.votingCloseAt)}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors duration-200" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

/* ---------- ElectionsListClient ---------- */

interface ElectionsListClientProps {
  elections: ElectionItem[];
}

export function ElectionsListClient({ elections }: ElectionsListClientProps) {
  const counts: Record<TabValue, number> = {
    active: filterElections(elections, "active").length,
    upcoming: filterElections(elections, "upcoming").length,
    past: filterElections(elections, "past").length,
    all: elections.length,
  };

  // Default to "all" if there are no active elections
  const defaultTab: TabValue = counts.active > 0 ? "active" : "all";

  return (
    <Tabs defaultValue={defaultTab} className="space-y-6">
      <TabsList>
        <TabsTrigger value="active">
          Active{counts.active > 0 && ` (${counts.active})`}
        </TabsTrigger>
        <TabsTrigger value="upcoming">
          Upcoming{counts.upcoming > 0 && ` (${counts.upcoming})`}
        </TabsTrigger>
        <TabsTrigger value="past">
          Past{counts.past > 0 && ` (${counts.past})`}
        </TabsTrigger>
        <TabsTrigger value="all">
          All{counts.all > 0 && ` (${counts.all})`}
        </TabsTrigger>
      </TabsList>

      {(["active", "upcoming", "past", "all"] as const).map((tab) => {
        const tabElections = filterElections(elections, tab);

        return (
          <TabsContent key={tab} value={tab}>
            {tabElections.length === 0 ? (
              <ElectionEmptyState
                title={TAB_EMPTY_MESSAGES[tab].title}
                description={TAB_EMPTY_MESSAGES[tab].description}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tabElections.map((election) => (
                  <ElectionCard key={election.id} election={election} />
                ))}
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
