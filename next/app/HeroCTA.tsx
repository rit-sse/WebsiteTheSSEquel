"use client";

import DancingLetters from "@/components/dancing-letters";
import NeoBrutalistButton from "@/components/neo-brutalist-button";
import SendIcon from "@/components/send-icon";
import RocketIcon from "@/components/rocket-icon";
import CalendarIcon from "@/components/calendar-icon";
import { NeoCard } from "@/components/ui/neo-card";

interface HeroCTAProps {
    description: string;
    weeklyMeetingCallout: string;
    discordLink: string;
}

export const HeroCTA = ({ description, weeklyMeetingCallout, discordLink }: HeroCTAProps) => {
    return (
        <div className="text-center lg:text-left w-full lg:w-[45%] lg:flex-shrink-0">
            <div className="flex flex-col items-center lg:items-start gap-1 py-2">
                <span className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold !leading-tight tracking-tight font-display text-foreground">
                    A place to
                </span>
                <DancingLetters 
                    text="build  your  best  ideas" 
                    className="justify-center lg:justify-start flex-nowrap"
                    letterClassName="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold !leading-none tracking-tight font-display text-primary"
                />
            </div>
            <p className="py-4 text-muted-foreground text-lg">
                {description}
            </p>
            <NeoCard depth={2} className="mt-2 inline-flex items-center gap-2 px-3 py-2">
                <CalendarIcon size={18} isHovered={false} className="text-primary flex-shrink-0" />
                <span className="font-bold text-foreground text-sm">
                    {weeklyMeetingCallout}
                </span>
            </NeoCard>
            <div className="mt-6 flex flex-wrap gap-4 justify-center lg:justify-start pb-2">
                <NeoBrutalistButton 
                    href={discordLink} 
                    text="Join Discord" 
                    variant="blue"
                    icon={<SendIcon size={18} isHovered={false} />}
                />
                <NeoBrutalistButton 
                    href="/about/get-involved" 
                    text="Get Involved" 
                    variant="orange"
                    icon={<RocketIcon size={18} isHovered={false} />}
                />
            </div>
        </div>
    );
};
