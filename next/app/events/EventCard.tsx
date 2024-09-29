'use client'
import { Event } from "./event";

export const EventCard: React.FC<Event> = (event: Event) => {
    return (
        <div className="flex flex-row xl:flex-col shadow-md rounded-3xl overflow-hidden bg-info-content max-w-[90%] xl:max-w-[340px] h-[250px] sm:h-[300px] xl:h-[600px] m-4">
        {/* These are the previous class attributes, they are staying here for convenience. */}
        {/* <div className="flex flex-col shadow-md rounded-3xl overflow-hidden bg-info-content max-w-[340px]  h-[600px] md:h-[600px] m-4"> */}
            <img src={event.imageSrc} className="invisible hidden sm:block sm:visible object-cover sm:w-[45%]  xl:w-full" alt="" />
            <div className="p-4">
                <h4 className="text-primary mb-3 text-2xl">{event.title.slice(0, 1).toUpperCase() + event.title.slice(1)}</h4> {/* Make sure the title is captialized, but otherwise, this is just the title of the card */}
                <h5 className="mb-2 text-sm">{event.date}</h5>
                <h5 className="mb-4">{event.location}</h5>
                <p>{event.description}</p>
            </div>
        </div>
    );
}