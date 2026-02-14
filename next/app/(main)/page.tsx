// This file renders the home page route (/) of the website.
// We know that this is the homepage because this file resides in the root of the `app` directory.

import HomepageContent from '../HomepageContent';
import { EventCard } from './events/EventCard';
import { Event } from "./events/event";
import { compareDateStrings, formatDate } from './events/calendar/utils';
import { getEvents } from '../api/event/eventService';
import { Sponsor } from '@/components/common/Sponsor';
import { HeroCTA } from '../HeroCTA';
import { HeroImage } from '../HeroImage';
import { NeoCard } from "@/components/ui/neo-card";
import prisma from '@/lib/prisma';

interface SponsorData {
    id: number;
    description: string;
    name: string;
    logoUrl: string;
    websiteUrl: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Tell next.js to run only during run-time execution
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {

    let events = await getEvents() as Event[] | null;

    // Fetch active sponsors from the database
    // Wrapped in try-catch to handle case where table doesn't exist yet
    let sponsors: { image: string; url: string; name: string; description: string }[] = [];
    try {
        const sponsorsData = await prisma.sponsor.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });

        // Transform to match the Sponsor component props
        sponsors = sponsorsData.map((sponsor: SponsorData) => ({
            image: sponsor.logoUrl,
            url: sponsor.websiteUrl,
            name: sponsor.name,
            description: sponsor.description,
        }));
    } catch (error) {
        // Table might not exist yet - fail gracefully
        console.error("Failed to fetch sponsors:", error);
    }
    
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
                        labHoursCallout={HomepageContent.labHoursCallout}
                        weeklyMeetingCallout={HomepageContent.weeklyMeetingCallout}
                        discordLink={HomepageContent.discordLink}
                    />
                    <HeroImage />
                </div>
            </NeoCard>
            
            {/* Upcoming Events */}
            <NeoCard className="w-full p-6 md:p-10">
              <h2 className='mb-6 text-3xl font-bold font-display'>Upcoming Events</h2>
              <div className='flex flex-row justify-center items-center'>
                {events && events.length > 0 ? (
                <div className='grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full'>
                    {events.map((event) => {
                        event.date = formatDate(event.date);
                        return (
                            <EventCard key={event.id} {...event} />
                        )
                    })}
                </div>
                ) : (
                    <p className="text-gray-500">No events available.</p>
                )}
              </div>
            </NeoCard>

            {/* Sponsors */}
            {sponsors.length > 0 && (
                <NeoCard className="w-full p-6 md:p-10">
                    <h2 className='mb-6 text-3xl font-bold font-display'>Sponsors</h2>
                    <div className='grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full'>
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
                </NeoCard>
            )}
        </div>
    );
}