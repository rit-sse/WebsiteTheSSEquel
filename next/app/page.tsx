// This file renders the home page route (/) of the website.
// We know that this is the homepage because this file resides in the root of the `app` directory.

import { CTAButton } from '@/components/common/CTAButton';
import HomepageContent from './HomepageContent';
import { EventCard } from './events/EventCard';
import { Event } from "./events/event";
import { compareDateStrings, formatDate } from './events/calendar/utils';

export default async function Home() {

    let events: Event[] = await fetch('http://localhost:3000/api/event').then((resp) => resp.json());

    // Only display first 3 upcoming events
    events = events.filter((event) => {
        return (Date.now() - (new Date(event.date).getTime())) < 0; // is negative if event is in the future
    });
    events = events.sort((event1, event2) => compareDateStrings(event1.date, event2.date))
    events = events.slice(0, 3);
    console.log(events);

    return (
        <div className='space-y-24'>
            {/* Hero section */}
            <div className='h-auto md:h-[55vh] my-auto flex flex-col md:flex-row items-center md:justify-evenly mt-24'>
                <div className="flex flex-col justify-center w-auto md:w-2/5">
                    <h1 className='text-center md:text-left'>
                        Society of
                        <span className="block lg:inline"> Software Engineers </span>
                    </h1>

                    <p className="mx-auto mt-4 sm:text-xl/relaxed text-center md:text-left">
                        {HomepageContent.description}
                    </p>
                    <p className='mt-4 font-bold text-center md:text-left'>
                        {HomepageContent.weeklyMeetingCallout}
                    </p>

                    <div className="mt-8 flex flex-row flex-wrap gap-4 min-[460px]:flex-row justify-center md:justify-start">
                        <CTAButton href={HomepageContent.slackLink} text="Join Slack" />
                        <CTAButton href="/about/get-involved" text="Get Involved" />
                    </div>
                </div>
                <div className='flex mt-12 md:mt-0 w-11/12 sm:w-[45%] sm:h-full justify-center'>
                    <img src="/images/student-involvement-1.jpg" alt="Tech committee meeting" className="w-full h-auto rounded-[60px]" />
                </div>
            </div>

            {/* Upcoming Events */}
            <div>
              <h1 className='mt-5'>Upcoming Events</h1>
              <div className='flex flex-row justify-center items-center'>
                <div className='mt-8 grid gap-8 grid-cols-3 w-10/12'>
                    {events.map((event, index) => {
                        event.date = formatDate(event.date);
                        return (
                            <EventCard key={index} {...event} />
                        )
                    })}
                </div>
              </div>
            </div>
        </div>
    );
}