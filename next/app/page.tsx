// This file renders the home page route (/) of the website.
// We know that this is the homepage because this file resides in the root of the `app` directory.

import { CTAButton } from '@/components/common/CTAButton';
import HomepageContent from './HomepageContent';
import { EventCard } from './events/EventCard';
import Image from 'next/image';
import { Event } from "./events/event";
import { compareDateStrings, formatDate } from './events/calendar/utils';
import { getEvents } from './api/event/eventService';

export default async function Home() {

    let events = await getEvents() as Event[] | null;

    // Allowing developers to not have to set up the DB
    if(events != null){
        // Only display first 3 upcoming events
        events = events.sort((event1, event2) => compareDateStrings(event1.date, event2.date))
        events = events.slice(0, 3);
        console.log(events);

    }

    return (
        <div className='space-y-24'>
            {/* Hero Component */}
            <div className="hero h-auto my-auto flex flex-col items-center md:justify-evenly mt-0 md:mt-4 lg:mt-24">
                <div className="hero-content flex-col lg:flex-row">
                    <div className="text-center lg:text-left">
                        <h1 className="text-4xl md:text-5xl font-bold leading-relaxed  md:leading-normal text-center lg:text-left">
                        Society of 
                            <span className="block lg:inline"> Software Engineers </span>
                        </h1>
                        <p className="py-6">
                            {HomepageContent.description}
                        </p>
                        <p className="mt-4 font-bold">
                            {HomepageContent.weeklyMeetingCallout}
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
                            <CTAButton href={HomepageContent.discordLink} text="Join Discord" />
                            <CTAButton href="/about/get-involved" text="Get Involved" />
                        </div>
                    </div>
                    <div className="flex mt-12 md:mt-0 w-11/12 md:w-[70%] lg:w-full justify-center">
                        <Image src="/student-involvement-1.jpg" alt="Tech committee meeting" className="rounded-[60px]" width={1000} height={1000} priority />
                    </div>
                </div>
            </div>

            {/* Upcoming Events */}
            {/* <div>
              <h1 className='mt-5'>Upcoming Events</h1>
              <div className='flex flex-row justify-center items-center'>
                {events && events.length > 0 ? (
                <div className='mt-8 grid gap-8 grid-cols-3 w-10/12'>
                    {events.map((event, index) => {
                        event.date = formatDate(event.date);
                        return (
                            <EventCard key={index} {...event} />
                        )
                    })}
                </div>
                ) : (
                    <p className="text-gray-500">No events available.</p>
                )}
              </div>
            </div> */}
        </div>
    );
}