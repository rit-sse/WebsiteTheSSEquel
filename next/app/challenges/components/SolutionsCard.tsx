"use client";

import { PropsWithChildren, useState } from "react";
import { ChallengeState, ChallengeType } from "../[id]/page";
import { ExpandingCard } from "./ExpandingCard";
import { useModal } from "./ModalProvider";

interface SolutionsCardProps extends PropsWithChildren {
    state: ChallengeState;
    type: ChallengeType;
}

export function SolutionsCard({ state, type, children }: SolutionsCardProps) {
    const { openModal } = useModal();

    const seen = state === "solved" || state === "revealed"; // comes from server

    const [ locked, setLocked ] = useState(!seen); // local override, should be okay on re-renders

    const handleUnlock = async () => {
        if (seen || !locked) return true; // shouldn't happen

        if (type === "current") {
            await openModal({
                description: <span className="block text-lg">To view the official solution, you need to solve the challenge or wait until the it ends.</span>,
                input: false,
                submitBtnText: "Close",
            });

            return false;
        }

        const result = await openModal({
            title: <span className="block text-xl font-semibold text-primary mb-1">View solution?</span>,
            description: <span>If you view the official solution you won't be able to submit your own solution anymore.</span>,
            input: false,
            cancelBtnText: "Cancel",
            submitBtnText: "Acknowledge",
        });

        if (result.submitted) setLocked(false);

        return result.submitted;
    }

    return (
        <ExpandingCard title="Solutions" barChildren={null} defaultExpanded={seen} handleUnlock={handleUnlock} locked={locked}>
            {children}
        </ExpandingCard>
    );
}

