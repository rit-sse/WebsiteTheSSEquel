'use client'
import { Event } from "./event";
import { clsx } from "clsx"; // you will need to do 'npm install' if you haven't already, as I have added this for light and dark mode color switching
import { useTheme } from "next-themes";
import { Theme } from '@/types/theme';

export const EventCard: React.FC<Event> = (event: Event) => {
    const { theme } = useTheme();

    return (
        <div className={clsx("flex flex-col shadow-md rounded-3xl overflow-hidden",
            { "bg-white": theme === Theme.Light, "bg-[#172630]": theme === Theme.Dark, },
        )}>
            <img src={event.imageSrc} className="w-full h-1/3" alt="" />
            <div className="p-4">
                <h4 className="text-primary">{event.title.slice(0, 1).toUpperCase() + event.title.slice(1)}</h4> {/* Make sure the title is captialized, but otherwise, this is just the title of the card */}
                <h5>{event.date}</h5>
                <h5>{event.location}</h5>
                <p>{event.description}</p>
            </div>
        </div>
    );
}