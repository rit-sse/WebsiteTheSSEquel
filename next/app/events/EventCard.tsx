import { Event } from "./event";

export default function EventCard(event: Event) {
    return (
        <div className="flex flex-col shadow-md bg-[#172630] border border-cyan-500 rounded-3xl overflow-hidden">
            <img src={event.imageSrc} className="w-full h-1/3" alt="" />
            <div className="p-4">
            <h4>{event.title.slice(0, 1).toUpperCase() + event.title.slice(1)}</h4> {/* Make sure the title is captialized, but otherwise, this is just the title of the card */}
            <h5>{event.date}</h5>
            <h5>{event.location}</h5>
            <p>{event.description}</p>
            </div>
        </div>
    );
}