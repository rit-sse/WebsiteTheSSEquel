'use client'
import { Event } from "./event";
import Image from "next/image";

export const EventCard: React.FC<Event> = (event: Event) => {
    return (
        <div className={`mx-2 mb-2 shadow-lg rounded overflow-hidden bg-muted`}>
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
          <div className={`px-4 pb-4`}>
            <h4 className="text-lg font-bold">{event.title}</h4>
            <p className="text-sm font-bold">{event.date}</p>
            <p className="text-sm">{event.location}</p>
            <p className="text-sm">{event.description}</p>
          </div>
        </div>
      );
}
