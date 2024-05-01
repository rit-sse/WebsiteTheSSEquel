'use client'
import { Event } from "./event";

export const EventCard: React.FC<Event> = (event: Event) => {
    console.log(event.image)
    return (
        <div className={`mx-2 mb-2 shadow-lg rounded overflow-hidden bg-base-2git 00 ${event.image ? '' : 'pt-4'}`}>
          {event.image && (
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <img src={event.image} className="absolute w-full h-full object-cover top-0 left-0" alt={event.title} />
            </div>
          )}
          <div className={`${event.image ? 'mt-2' : ''} px-4 pb-4`}>
            <h4 className="text-lg font-bold">{event.title}</h4>
            <p className="text-sm font-bold">{event.date}</p>
            <p className="text-sm">{event.location}</p>
            <p className="text-sm">{event.description}</p>
          </div>
        </div>
      );
}