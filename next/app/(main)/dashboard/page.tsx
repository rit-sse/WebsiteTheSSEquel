"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  filterVisibleSections,
  type DashboardSection,
} from "@/lib/dashboardSections";
import { useDashboardAuth } from "./DashboardAuthProvider";
import SectionPreview from "./_components/SectionPreview";

/**
 * Officer Dashboard landing page.
 *
 * Replaces the old navbar "Dashboard" dropdown. Renders one card per
 * dashboard section the user has access to, each with a stylized preview
 * of the destination. Auth flags are read from the dashboard layout's
 * server-resolved context — no extra `/api/authLevel` round-trip.
 */
export default function OfficerDashboardPage() {
  const auth = useDashboardAuth();

  const sections = React.useMemo(() => filterVisibleSections(auth), [auth]);

  // Mentor-availability indicator. Only fetched for mentoring heads, mirroring
  // the navbar logic that previously owned this dot.
  const [hasMentorAvailabilityUpdates, setHasMentorAvailabilityUpdates] =
    React.useState(false);

  React.useEffect(() => {
    if (!auth.isMentoringHead) {
      setHasMentorAvailabilityUpdates(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/mentor-availability/updates");
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        const latestUpdatedAt = data?.latestUpdatedAt
          ? Date.parse(data.latestUpdatedAt)
          : 0;
        const seenAt = Number(
          localStorage.getItem("mentor-availability-last-seen") || "0"
        );
        setHasMentorAvailabilityUpdates(latestUpdatedAt > seenAt);
      } catch (error) {
        console.error("Error checking mentor availability:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth.isMentoringHead]);

  React.useEffect(() => {
    const handleSeen = () => setHasMentorAvailabilityUpdates(false);
    window.addEventListener("mentor-availability-seen", handleSeen);
    return () => {
      window.removeEventListener("mentor-availability-seen", handleSeen);
    };
  }, []);

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
            showRedDot={
              section.id === "mentoring" && hasMentorAvailabilityUpdates
            }
          />
        ))}
      </div>
    </div>
  );
}

function SectionCard({
  section,
  showRedDot,
}: {
  section: DashboardSection;
  showRedDot: boolean;
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
          "p-4 sm:p-5 transition-all duration-150",
          "neo:group-hover:-translate-x-0.5 neo:group-hover:-translate-y-0.5",
          "neo:group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
          "clean:group-hover:shadow-lg clean:group-hover:-translate-y-0.5"
        )}
      >
        <SectionPreview
          id={section.id}
          accentClass={section.accentClass}
          showRedDot={showRedDot}
        />
        <div className="mt-3 sm:mt-4 flex items-start justify-between gap-2">
          <h2 className="font-display text-lg font-bold leading-tight">
            {section.title}
          </h2>
          {showRedDot && (
            <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
              New
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {section.description}
        </p>
      </Card>
    </Link>
  );
}
