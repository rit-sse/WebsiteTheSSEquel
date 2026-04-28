"use client";

import { useEffect, useState, useMemo } from "react";
import { Event } from "./event";
import { EventCard } from "./EventCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Calendar, Archive } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Derive academic year label from a Date: Aug-Dec → "YYYY–YY+1", Jan-Jul → "(YYYY-1)–YY" */
function academicYear(d: Date): string {
  const m = d.getMonth();
  const y = d.getFullYear();
  if (m >= 7) return `${y}\u2013${String(y + 1).slice(2)}`;
  return `${y - 1}\u2013${String(y).slice(2)}`;
}

function EventCardSkeleton() {
  return (
    <Card depth={2} className="overflow-hidden">
      <Skeleton className="w-full aspect-video" />
      <div className="px-4 py-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-full" />
      </div>
    </Card>
  );
}

/** Format an ISO date string for display */
function formatEventDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function EventsArchivePage() {
  const [events, setEvents] = useState<(Event & { date: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/event");
        if (res.ok) {
          const data = await res.json();
          // Sort by date descending (most recent first)
          data.sort(
            (a: any, b: any) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setEvents(data);
        }
      } catch (err) {
        console.error("Failed to fetch events:", err);
      }
      setIsLoading(false);
    })();
  }, []);

  // Extract unique academic years from events
  const years = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => set.add(academicYear(new Date(e.date))));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [events]);

  // Filter events
  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchYear =
        selectedYear === "all" ||
        academicYear(new Date(e.date)) === selectedYear;
      const matchSearch =
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (e.location ?? "").toLowerCase().includes(search.toLowerCase());
      return matchYear && matchSearch;
    });
  }, [events, selectedYear, search]);

  return (
    <section className="mt-16 pb-16">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        <Card depth={1} className="p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-primary flex items-center justify-center gap-3">
              <Archive className="h-8 w-8" />
              Events
            </h1>
            <p className="mt-3 text-xl leading-8">
              Browse our history of events, workshops, and gatherings.
            </p>
            <div className="mt-4">
              <Link href="/events/calendar">
                <Button variant="neutral" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Calendar
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          {!isLoading && (
            <p className="text-sm text-muted-foreground mb-4">
              {filtered.length} event{filtered.length !== 1 ? "s" : ""}
              {selectedYear !== "all" ? ` in ${selectedYear}` : ""}
              {search ? ` matching "${search}"` : ""}
            </p>
          )}

          {/* Event grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <>
                <EventCardSkeleton />
                <EventCardSkeleton />
                <EventCardSkeleton />
                <EventCardSkeleton />
                <EventCardSkeleton />
                <EventCardSkeleton />
              </>
            ) : filtered.length > 0 ? (
              filtered.map((event) => (
                <EventCard
                  key={event.id}
                  {...event}
                  date={formatEventDate(event.date)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No events found.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
