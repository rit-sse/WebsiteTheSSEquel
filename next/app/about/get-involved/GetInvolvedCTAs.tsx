"use client";

import NeoBrutalistButton from "@/components/neo-brutalist-button";
import CalendarIcon from "@/components/calendar-icon";
import SendIcon from "@/components/send-icon";

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
                        icon={<CalendarIcon size={18} isHovered />}
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
                        icon={<SendIcon size={18} isHovered />}
                    />
                </div>
            </section>
        </>
    );
};
