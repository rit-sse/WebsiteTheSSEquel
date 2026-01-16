// This file renders the home page route (/) of the website.
// We know that this is the homepage because this file resides in the root of the `app` directory.

import HomepageContent from './HomepageContent';
import { EventCard } from './events/EventCard';
import { Event } from "./events/event";
import { compareDateStrings, formatDate } from './events/calendar/utils';
import { getEvents } from './api/event/eventService';
import { Sponsor } from '@/components/common/Sponsor';
import { HeroCTA } from './HeroCTA';
import { HeroImage } from './HeroImage';
import { NeoCard } from "@/components/ui/neo-card";
import { Card } from "@/components/ui/card";

export default async function Home() {

    let events = await getEvents() as Event[] | null;

    // creates sponsor dictionary to hold url and image of each sponsor
    const sponsors = [
        {
            image: "/images/sponsors/gcis.png",
            url: "https://www.rit.edu/computing/",
            name: "Golisano College",
            description: "RIT's College of Computing and Information Sciences, home to SSE."
        }, 
        {
            image: "/images/sponsors/M_and_T.png",
            url: "https://www.mtb.com/",
            name: "M&T Bank",
            description: "A regional bank providing financial services across the Northeast."
        },
        {
            image: "/images/sponsors/mindex.png",
            url: "https://www.mindex.com/",
            name: "Mindex",
            description: "A Rochester-based technology company specializing in IT solutions."
        }
    ]
    
    // Allowing developers to not have to set up the DB
    if(events != null){

        const currentDate = new Date();

        // Only display first 3 upcoming events
        events = events.filter((value => compareDateStrings(currentDate.toISOString(), value.date) < 0))
                        .sort((a, b) => compareDateStrings(a.date, b.date))
                        .slice(0, 3);
    }

    return (
        <div className='space-y-8 w-full max-w-[94vw] xl:max-w-[1400px] mx-auto px-4'>
            {/* Hero Component */}
            <NeoCard className="w-full p-6 md:p-10">
                <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-10">
                    <HeroCTA 
                        description={HomepageContent.description}
                        weeklyMeetingCallout={HomepageContent.weeklyMeetingCallout}
                        discordLink={HomepageContent.discordLink}
                    />
                    <HeroImage />
                </div>
            </NeoCard>
            
            {/* Upcoming Events */}
            <Card className="w-full p-6 md:p-10">
              <h2 className='mb-6 text-3xl font-bold font-display'>Upcoming Events</h2>
              <div className='flex flex-row justify-center items-center'>
                {events && events.length > 0 ? (
                <div className='grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full'>
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
            </Card>

            {/* Sponsors */}
            <Card className="w-full p-6 md:p-10">
                <h2 className='mb-6 text-3xl font-bold font-display'>Sponsors</h2>
                <div className='flex flex-wrap justify-center items-stretch gap-6'>
                    {sponsors.map(sponsor => (
                        <Sponsor
                            key={sponsor.url}
                            url={sponsor.url}
                            imageLink={sponsor.image}
                            name={sponsor.name}
                            description={sponsor.description}
                        />
                    ))}
                </div>
            </Card>
        </div>
    );
}