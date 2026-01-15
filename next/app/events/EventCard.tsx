'use client'
import { Event } from "./event";
import Image from "next/image";
import { Card } from "@/components/ui/card";

export const EventCard: React.FC<Event> = (event: Event) => {
    return (
        <Card depth={2} className="overflow-hidden">
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
            <p className="text-sm font-bold text-primary">{event.date}</p>
            <p className="text-sm text-muted-foreground">{event.location}</p>
            <p className="text-sm mt-2">{event.description}</p>
          </div>
        </Card>
      );
}
