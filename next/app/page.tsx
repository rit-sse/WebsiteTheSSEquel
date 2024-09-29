// This file renders the home page route (/) of the website.
// We know that this is the homepage because this file resides in the root of the `app` directory.

import { CTAButton } from '@/components/common/CTAButton';
import HomepageContent from './HomepageContent';
import { UpcomingEvents } from './HomepageContent';
import { EventCard } from './events/EventCard';

export default function Home() {
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
                <div className='flex mt-12 md:mt-0 w-11/12 md:w-[45%] sm:h-full justify-center'>
                    <img src="student-involvement-1.jpg" alt="Tech committee meeting" className="w-full h-auto rounded-[60px]" />
                </div>
            </div>

            {/* Upcoming Events */}
            <div>
              <h1 className='mt-5'>Upcoming Events</h1>
                <div className='flex flex-col xl:flex-row justify-center items-center mt-8 md:gap-8 lg:gap-4 '>
                    {UpcomingEvents.map((event, idx) => (
                        <EventCard key={idx} {...event} />
                    ))}
                </div>
            </div>
        </div>
    );
}