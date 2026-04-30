import Image from "next/image";
import { CalendarDays, MapPin } from "lucide-react";
import prisma from "@/lib/prisma";
import type { BlockRenderProps } from "../types";

/**
 * EventFeedBlock — pulls upcoming or past events from the Event table.
 * Server component. Cached implicitly by Next ISR on the parent page.
 */
export async function EventFeedBlock({ props }: BlockRenderProps<"eventFeed">) {
  const now = new Date();
  const events = await prisma.event.findMany({
    where:
      props.mode === "upcoming"
        ? { date: { gte: now } }
        : { date: { lt: now } },
    orderBy: { date: props.mode === "upcoming" ? "asc" : "desc" },
    take: props.limit,
  });

  if (events.length === 0) {
    return (
      <div className="my-8 rounded-lg border border-dashed border-border/40 p-8 text-center text-sm text-muted-foreground">
        No {props.mode === "upcoming" ? "upcoming" : "past"} events to show right now.
      </div>
    );
  }

  return (
    <section className="my-10">
      {props.heading && (
        <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-5">
          {props.heading}
        </h2>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <li
            key={event.id}
            className="group relative overflow-hidden rounded-lg border border-border bg-card transition-transform hover:-translate-y-0.5 neo:shadow-neo neo:hover:shadow-none neo:hover:translate-x-[2px] neo:hover:translate-y-[2px]"
          >
            {props.showImages && event.image && (
              <div className="relative w-full overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-display text-lg font-semibold tracking-tight">{event.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatEventDate(event.date)}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {event.location}
                  </span>
                )}
              </div>
              {event.description && (
                <p className="mt-3 line-clamp-3 text-sm text-foreground/85">{event.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatEventDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZone: "America/New_York",
  }).format(d);
}
