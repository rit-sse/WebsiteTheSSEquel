"use client";

import DancingLetters from "@/components/dancing-letters";
import NeoBrutalistButton from "@/components/neo-brutalist-button";
import { Send, Rocket, Calendar } from "lucide-react";
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
                <Calendar className="h-[18px] w-[18px] text-primary flex-shrink-0" />
                <span className="font-bold text-foreground text-sm">
                    {weeklyMeetingCallout}
                </span>
            </NeoCard>
            <div className="mt-6 flex flex-wrap gap-4 justify-center lg:justify-start pb-2">
                <NeoBrutalistButton 
                    href={discordLink} 
                    text="Join Discord" 
                    variant="blue"
                    icon={<Send className="h-[18px] w-[18px]" />}
                />
                <NeoBrutalistButton 
                    href="/about/get-involved" 
                    text="Get Involved" 
                    variant="orange"
                    icon={<Rocket className="h-[18px] w-[18px]" />}
                />
            </div>
        </div>
    );
};
