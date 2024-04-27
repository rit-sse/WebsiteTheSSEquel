'use client'
import { Event } from "./event";

export const EventCard: React.FC<Event> = (event: Event) => {
    return (
        <div className={`event-card ${event.image ? '' : 'pt-4'}`}>
          {event.image && (
            <img src={event.image} className="w-full h-1/3" alt={event.title} />
          )}
          <div className="px-4 pb-4">
            <h4 className="text-primary">{event.title.slice(0, 1).toUpperCase() + event.title.slice(1)}</h4>
            <h5>{event.date}</h5>
            <h5>{event.location}</h5>
            <p>{event.description}</p>
          </div>
        </div>
      );
      
}