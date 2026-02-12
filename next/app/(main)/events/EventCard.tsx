'use client'
import { Event } from "./event";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export const EventCard: React.FC<Event> = (event: Event) => {
    // Use event ID to look up the event on the calendar page
    const eventParam = event.id ? `?eventId=${encodeURIComponent(event.id)}` : '';
    
    return (
        <Link href={`/events/calendar${eventParam}`} className="block">
            <Card depth={2} className="overflow-hidden transition-all hover:scale-[1.02] cursor-pointer">
                <div className="relative w-full aspect-video">
                  {event.image ? (
                    <Image 
                      src={event.image} 
                      alt={event.title} 
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <Image 
                      src='/icon.png' 
                      alt="SSE Logo"
                      fill
                      className="object-cover" 
                    />
                  )}
                </div>
              <div className="px-4 py-4">
                <h3 className="text-lg font-display">{event.title}</h3>
                <p className="text-sm font-bold text-chart-2 dark:text-foreground">{event.date}</p>
                <p className="text-sm text-muted-foreground">{event.location}</p>
                <p className="text-sm mt-2">{event.description}</p>
              </div>
            </Card>
        </Link>
      );
}
