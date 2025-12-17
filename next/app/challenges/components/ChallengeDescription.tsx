"use client";

import DarkModeToggle from "@/components/common/DarkModeToggle";
import { HTMLAttributes } from "react";
import { AttemptBadge } from "./AttemptBadge";
import { ExpandingCard } from "./ExpandingCard";

interface ChallengeDescriptionProps extends HTMLAttributes<HTMLDivElement> {
    id: string;
    title: string;
}

export function ChallengeDescription({ id, title, children }: ChallengeDescriptionProps) {
    return (
        <ExpandingCard
            title={`${id}. ${title}`}
            barChildren={
                <>
                    <AttemptBadge attempts={1} solved className="mr-1" />
                    <DarkModeToggle className="hover:scale-100" iconClassName="!w-6 !h-6" />
                </>
            }
        >
            <div className="p-6 text-base">{children}</div>
        </ExpandingCard>
    );
}