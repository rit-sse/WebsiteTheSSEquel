"use client";

import NeoBrutalistButton from "@/components/neo-brutalist-button";
import { Calendar, Send } from "lucide-react";

export const GetInvolvedCTAs = () => {
    return (
        <div className="flex flex-col items-center gap-8 pt-8">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <h3 className="font-display text-xl md:text-2xl lg:text-3xl text-chart-2 dark:text-foreground">
                    Come to our events
                </h3>
                <NeoBrutalistButton 
                    href="/events/calendar" 
                    text="Events"
                    variant="blue"
                    icon={<Calendar className="h-[18px] w-[18px]" />}
                />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <h3 className="font-display text-xl md:text-2xl lg:text-3xl text-chart-2 dark:text-foreground">
                    Talk to us
                </h3>
                <NeoBrutalistButton 
                    href="https://www.discord.gg/rNC6wj82kq" 
                    text="Join our Discord"
                    variant="orange"
                    icon={<Send className="h-[18px] w-[18px]" />}
                />
            </div>
        </div>
    );
};
