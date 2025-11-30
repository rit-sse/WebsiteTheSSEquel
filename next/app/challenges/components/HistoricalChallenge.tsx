"use client";

import { CircleCheckBig, CircleDot, CircleSlash} from 'lucide-react';

interface ButtonProps {
    challengeName: string;
    problemState: "attempted" | "solved" | "unattemped" | "revealed";
}

function getIconFromState(problemState: string) {
    switch (problemState) {
        case "solved":
            return <CircleCheckBig color="#0ed76c"></CircleCheckBig>
        case "attempted":
            return <CircleDot color="#e6c24b" />
        case "unattempted":
            return <CircleSlash color="#6d6d6d" />
    }
}

export function HistoricalButton({ challengeName, problemState } : ButtonProps) {
    return (
        <button className="transition-shadow shadow-md hover:shadow-lg rounded-xl flex flex-row justify-between h-10 w-56 items-center">
            <span className="truncate flex pl-3">{challengeName}</span>
            <span className="flex pr-3">{getIconFromState(problemState)}</span>
        </button>
    )
}