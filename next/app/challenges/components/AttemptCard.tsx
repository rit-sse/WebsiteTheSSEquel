import { HTMLAttributes } from "react";
import { ExpandingCard } from "./ExpandingCard";

interface AttemptCardProps extends HTMLAttributes<HTMLDivElement> {}

export function AttemptCard({ children }: AttemptCardProps) {
    return (
        <ExpandingCard
            title="Your Attempt"
            barChildren={null}
            defaultExpanded={true}
        >
            <div className="p-6 text-base">{children}</div>
        </ExpandingCard>
    );
}
