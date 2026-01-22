"use client";

import NeoBrutalistButton from "@/components/neo-brutalist-button";
import { Calendar, Send } from "lucide-react";

export const GetInvolvedCTAs = () => {
    return (
        <>
            <section className="pt-8">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <h3 className="font-display text-xl md:text-2xl lg:text-3xl text-primary uppercase tracking-wider">
                        Come to our events!
                    </h3>
                    <NeoBrutalistButton 
                        href="/events/calendar" 
                        text="Events"
                        variant="green"
                        icon={<Calendar className="h-[18px] w-[18px]" />}
                    />
                </div>
            </section>
            <section className="pt-8">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <h3 className="font-display text-xl md:text-2xl lg:text-3xl text-primary uppercase tracking-wider">
                        Talk to us!
                    </h3>
                    <NeoBrutalistButton 
                        href="https://www.discord.gg/rNC6wj82kq" 
                        text="Join our Discord"
                        variant="blue"
                        icon={<Send className="h-[18px] w-[18px]" />}
                    />
                </div>
            </section>
        </>
    );
};
