import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  filterVisibleSections,
  type DashboardSection,
} from "@/lib/dashboardSections";
import {
  getDashboardSummary,
  type DashboardSummary,
} from "@/lib/dashboardSummary";
import { getAuthLevel } from "@/lib/services/authLevelService";
import SectionPreview from "./_components/SectionPreview";
import MentorAvailabilityDot from "./_components/MentorAvailabilityDot";

/**
 * Officer Dashboard landing page.
 *
 * Replaces the old navbar "Dashboard" dropdown. Renders one card per
 * dashboard section the user has access to, each with a stylized preview
 * of the destination plus a small slice of live data (counts, recent rows,
 * thumbnails). All queries run server-side in parallel inside
 * `getDashboardSummary()`, so the page is rendered with real numbers on
 * first paint — no client-side fan-out.
 *
 * Auth comes straight from the server-side `getAuthLevel()` (the layout
 * already gates non-officers, so reaching this code means the user is at
 * least an officer / mentor / SE admin).
 */
export default async function OfficerDashboardPage() {
  const [authLevel, summary] = await Promise.all([
    getAuthLevel(),
    getDashboardSummary(),
  ]);

  const sections = filterVisibleSections({
    isOfficer: authLevel.isOfficer,
    isMentor: authLevel.isMentor,
    isPrimary: authLevel.isPrimary,
    isMentoringHead: authLevel.isMentoringHead,
    isSeAdmin: authLevel.isSeAdmin,
    isTechCommitteeHead: authLevel.isTechCommitteeHead,
    isTechCommitteeDivisionManager: authLevel.isTechCommitteeDivisionManager,
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-6 sm:mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          Officer Dashboard
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Jump to any of the management areas you have access to.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            summary={summary[section.id]}
            mountMentorDot={
              section.id === "mentoring" && authLevel.isMentoringHead
            }
          />
        ))}
      </div>
    </div>
  );
}

function SectionCard({
  section,
  summary,
  mountMentorDot,
}: {
  section: DashboardSection;
  summary: DashboardSummary[typeof section.id];
  mountMentorDot: boolean;
}) {
  return (
    <Link
      href={section.href}
      className={cn(
        "group block rounded-xl",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <Card
        depth={1}
        className={cn(
          "relative p-4 sm:p-5 transition-all duration-150",
          "neo:group-hover:-translate-x-0.5 neo:group-hover:-translate-y-0.5",
          "neo:group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
          "clean:group-hover:shadow-lg clean:group-hover:-translate-y-0.5"
        )}
      >
        <div className="relative">
          <SectionPreview
            id={section.id}
            accentClass={section.accentClass}
            data={summary}
          />
          {mountMentorDot && <MentorAvailabilityDot />}
        </div>
        <div className="mt-3 sm:mt-4 flex items-start justify-between gap-2">
          <h2 className="font-display text-lg font-bold leading-tight">
            {section.title}
          </h2>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {section.description}
        </p>
      </Card>
    </Link>
  );
}
