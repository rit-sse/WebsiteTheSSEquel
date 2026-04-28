"use client";

import { useEffect, useState } from "react";
import OfficerCard from "./OfficerCard";
import EmptyOfficerCard from "./EmptyOfficerCard";
import {
  HistoricalOfficer,
  HistoricalYear,
  Team,
  TeamMember,
  OfficerPosition,
  PositionWithOfficer,
} from "./team";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronDown, Clock, Settings } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";

// Skeleton component for officer cards
function OfficerCardSkeleton() {
  return (
    <Card
      depth={2}
      className="w-full max-w-[280px] p-5 flex flex-col items-center"
    >
      <Skeleton className="h-24 w-24 rounded-full mb-3" />
      <Skeleton className="h-5 w-32 mb-1" />
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-12 w-full mb-3" />
      <div className="flex gap-3 pt-3 border-t border-border w-full justify-center">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-5 w-5" />
      </div>
    </Card>
  );
}

// Hook to check user auth level
function useAuthLevel() {
  const [authLevel, setAuthLevel] = useState<{
    isOfficer: boolean;
    isMentor: boolean;
  }>({ isOfficer: false, isMentor: false });

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/authLevel");
        const data = await response.json();
        setAuthLevel({
          isOfficer: data.isOfficer ?? false,
          isMentor: data.isMentor ?? false,
        });
      } catch {
        setAuthLevel({ isOfficer: false, isMentor: false });
      }
    })();
  }, []);

  return authLevel;
}

// Component to show manage link for officers
function ManageLink({ isOfficer }: { isOfficer: boolean }) {
  if (!isOfficer) return null;

  return (
    <Link href="/dashboard/positions">
      <Button variant="neutral" size="sm">
        <Settings className="h-4 w-4 mr-2" />
        Manage Officers
      </Button>
    </Link>
  );
}

function HistoricalOfficerGrid({ officers }: { officers: HistoricalOfficer[] }) {
  if (officers.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center">
      {officers.map((officer) => (
        <OfficerCard
          key={officer.id}
          teamMember={{
            officer_id: String(officer.id),
            user_id: String(officer.user.id),
            name: officer.user.name,
            image: officer.user.image ?? "",
            title: officer.position.title,
            email: officer.user.email,
            desc: officer.user.description ?? undefined,
            linkedin: officer.user.linkedIn ?? undefined,
            github: officer.user.gitHub ?? undefined,
          }}
        />
      ))}
    </div>
  );
}

function PastOfficersSection({
  history,
  isLoading,
}: {
  history: HistoricalYear[];
  isLoading: boolean;
}) {
  const [openTerms, setOpenTerms] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <div className="border-t border-border pt-10 mt-12">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Skeleton className="h-7 w-40" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (history.length === 0) return null;

  const toggleTerm = (term: string) => {
    setOpenTerms((prev) => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });
  };

  return (
    <div className="border-t border-border pt-10 mt-12">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center gap-2 text-primary">
          <Clock className="h-5 w-5" />
          <h2>Past Officers</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse previous SSE leadership by term.
        </p>
      </div>

      <div className="space-y-3">
        {history.map((term) => {
          const total =
            term.primary_officers.length +
            term.se_office.length +
            term.committee_heads.length;
          const isOpen = openTerms.has(term.year);

          return (
            <div
              key={term.year}
              className="rounded-lg border border-border bg-surface-1 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleTerm(term.year)}
                className="w-full flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 text-left hover:bg-surface-2 transition-colors"
                aria-expanded={isOpen}
              >
                <span className="font-semibold text-primary">{term.year}</span>
                <span className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {total} officer{total === 1 ? "" : "s"}
                  </span>
                  <span className="hidden md:inline">
                    {term.primary_officers.length} primary ·{" "}
                    {term.se_office.length} SE Office ·{" "}
                    {term.committee_heads.length} committee
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </span>
              </button>

              {isOpen && (
                <div className="px-4 py-5 border-t border-border space-y-8">
                  {term.primary_officers.length > 0 && (
                    <section>
                      <h3 className="text-base font-semibold text-primary mb-4">
                        Primary Officers
                      </h3>
                      <HistoricalOfficerGrid officers={term.primary_officers} />
                    </section>
                  )}
                  {term.se_office.length > 0 && (
                    <section>
                      <h3 className="text-base font-semibold text-primary mb-4">
                        SE Office
                      </h3>
                      <HistoricalOfficerGrid officers={term.se_office} />
                    </section>
                  )}
                  {term.committee_heads.length > 0 && (
                    <section>
                      <h3 className="text-base font-semibold text-primary mb-4">
                        Committee Heads
                      </h3>
                      <HistoricalOfficerGrid officers={term.committee_heads} />
                    </section>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Leadership() {
  // State list of all positions with their officers
  const [teamData, setTeamData] = useState<Team>({
    primary_officers: [],
    se_office: [],
    committee_heads: [],
  });
  const [history, setHistory] = useState<HistoricalYear[]>([]);
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  // Auth level to determine if unfilled positions should be shown
  const { isOfficer, isMentor } = useAuthLevel();
  // Only mentors and officers can see unfilled positions
  const canSeeUnfilledPositions = isOfficer || isMentor;

  // Get all positions and officers when page opens
  useEffect(() => {
    getOfficers();
    getHistory();
  }, []);

  const getOfficers = async () => {
    setIsLoading(true);
    const team: Team = {
      primary_officers: [],
      se_office: [],
      committee_heads: [],
    };

    try {
      // Fetch all positions and active officers in parallel
      const [positionsResponse, officersResponse] = await Promise.all([
        fetch("/api/officer-positions"),
        fetch("/api/officer/active"),
      ]);

      if (!positionsResponse.ok || !officersResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const positions: OfficerPosition[] = await positionsResponse.json();
      const officers = await officersResponse.json();

      // Create a map of position title to active officer
      const officerByPosition = new Map<string, TeamMember>();
      officers.forEach((officer: any) => {
        const teamMember: TeamMember = {
          officer_id: officer.id,
          user_id: officer.user.id,
          name: officer.user.name,
          image: officer.user.image,
          title: officer.position.title,
          email: officer.user.email,
          desc: officer.user.description,
          linkedin: officer.user.linkedIn,
          github: officer.user.gitHub,
        };
        officerByPosition.set(officer.position.title, teamMember);
      });

      // Map positions to PositionWithOfficer. Three buckets:
      //   - primary_officers: position.is_primary === true
      //   - se_office:        position.category === "SE_OFFICE"
      //   - committee_heads:  everything else
      // SE Office positions don't carry is_primary, so they would have
      // landed in Committee Heads under the old two-bucket logic — the
      // SE Office wants their own dedicated section per the SE Office.
      positions.forEach((position) => {
        const positionWithOfficer: PositionWithOfficer = {
          position,
          officer: officerByPosition.get(position.title) || null,
        };

        if (position.is_primary) {
          team.primary_officers.push(positionWithOfficer);
        } else if (position.category === "SE_OFFICE") {
          team.se_office.push(positionWithOfficer);
        } else {
          team.committee_heads.push(positionWithOfficer);
        }
      });

      // Sort each non-primary bucket by title for stable rendering.
      team.se_office.sort((a, b) =>
        a.position.title.localeCompare(b.position.title)
      );
      team.committee_heads.sort((a, b) =>
        a.position.title.localeCompare(b.position.title)
      );
    } catch (error) {
      console.error("Error:", error);
    }

    setTeamData(team);
    setIsLoading(false);
  };

  const getHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const response = await fetch("/api/officer/history");
      if (response.ok) {
        const data: HistoricalYear[] = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Error fetching officer history:", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  return (
    <section className="mt-16 pb-16">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        {/* Outer wrapper card */}
        <Card depth={1} className="p-6 md:p-8">
          {/* Header section */}
          <div className="text-center mb-8">
            <h1 className="text-primary">Meet our Team</h1>
            <p className="mt-3 text-xl leading-8">
              Have questions? Feel free to reach out to any of our officers!
            </p>
            <div className="mt-4">
              <ManageLink isOfficer={isOfficer} />
            </div>
          </div>

          {/* Primary Officers */}
          <div className="mb-10">
            <h2 className="text-center text-primary mb-6">Primary Officers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center">
              {isLoading ? (
                <>
                  <OfficerCardSkeleton />
                  <OfficerCardSkeleton />
                  <OfficerCardSkeleton />
                  <OfficerCardSkeleton />
                </>
              ) : (
                teamData.primary_officers.map((item, idx) =>
                  item.officer ? (
                    <OfficerCard key={idx} teamMember={item.officer} />
                  ) : canSeeUnfilledPositions ? (
                    <EmptyOfficerCard key={idx} position={item.position} />
                  ) : null
                )
              )}
            </div>
          </div>

          {/* SE Office — distinct from Committee Heads per the SE Office.
              Filled positions render normally; empty slots only show to
              members + officers, like the other buckets. The whole
              section is hidden if there are zero positions configured
              (so deployments without SE Office seeding don't get an
              empty header). */}
          {teamData.se_office.length > 0 && (
            <div className="mb-10">
              <h2 className="text-center text-primary mb-6">SE Office</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
                {isLoading ? (
                  <>
                    <OfficerCardSkeleton />
                    <OfficerCardSkeleton />
                    <OfficerCardSkeleton />
                    <OfficerCardSkeleton />
                  </>
                ) : (
                  teamData.se_office.map((item, idx) =>
                    item.officer ? (
                      <OfficerCard key={idx} teamMember={item.officer} />
                    ) : canSeeUnfilledPositions ? (
                      <EmptyOfficerCard key={idx} position={item.position} />
                    ) : null
                  )
                )}
              </div>
            </div>
          )}

          {/* Committee Heads */}
          <div>
            <h2 className="text-center text-primary mb-6">Committee Heads</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
              {isLoading ? (
                <>
                  <OfficerCardSkeleton />
                  <OfficerCardSkeleton />
                  <OfficerCardSkeleton />
                  <OfficerCardSkeleton />
                  <OfficerCardSkeleton />
                  <OfficerCardSkeleton />
                </>
              ) : (
                teamData.committee_heads.map((item, idx) =>
                  item.officer ? (
                    <OfficerCard key={idx} teamMember={item.officer} />
                  ) : canSeeUnfilledPositions ? (
                    <EmptyOfficerCard key={idx} position={item.position} />
                  ) : null
                )
              )}
            </div>
          </div>

          <PastOfficersSection
            history={history}
            isLoading={isHistoryLoading}
          />
        </Card>
      </div>
    </section>
  );
}
