'use client'
import { Event } from "./event";

export const EventCard: React.FC<Event> = (event: Event) => {
    return (
        <div className="flex flex-col shadow-md rounded-3xl overflow-hidden bg-info-content max-w-[340px]">
            <img src={event.imageSrc} className="w-full" alt="" />
            <div className="p-4">
                <h4 className="text-primary">{event.title.slice(0, 1).toUpperCase() + event.title.slice(1)}</h4> {/* Make sure the title is captialized, but otherwise, this is just the title of the card */}
                <h5>{event.date}</h5>
                <h5>{event.location}</h5>
                <p>{event.description}</p>
            </div>
        </div>
    );
}