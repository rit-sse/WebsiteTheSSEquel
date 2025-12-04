"use client";

import { CircleCheckBig, CircleDot, CircleSlash, CircleX} from 'lucide-react';

interface ButtonProps {
    challengeName: string;
    problemState: "attempted" | "solved" | "unattempted" | "revealed";
}

function getIconFromState(problemState: string) {
    switch (problemState) {
        case "solved":
            return <CircleCheckBig color="#0ed76c"/>
        case "attempted":
            return <CircleDot color="#e6c24b" />
        case "revealed":
            return <CircleX color="red"/>
        default:
            return <CircleSlash color="#6d6d6d" />
    }
}

function getGradientFromState(problemState: string) {
    console.log(problemState);
    switch (problemState) {
        case "solved":
            return "from-[#ddf6e5] to-[#76b47b]"
        case "attempted":
            return "from-[#fcf7e5] to-[#e7c756]"
        case "revealed":
            return "from-[#fde3e3] to-[#df3a11]"
        default:
            return "from-[#ececec] to-[#7a7a7a]"
    }
}

export function HistoricalButton({ challengeName, problemState } : ButtonProps) {
    const gradientClass =  `flex rounded-full mx-auto 
                    bg-gradient-to-r ${getGradientFromState(problemState)}
                    shadow-lg p-0.5`
    return (
        // "flex rounded-xl mx-auto bg-gradient-to-tr from-red-400 via-orange-400 to-rose-400 p-[2px] shadow-lg"

        <button className={gradientClass}>
            <div className="bg-white transition-shadow shadow-md hover:shadow-lg 
                            rounded-full flex flex-row justify-between 
                            h-10 w-56 items-center">
                <span className="flex-1 text-left overflow-hidden whitespace-nowrap text-ellipsis pl-3">{challengeName}</span>
                <span className="flex pr-3">{getIconFromState(problemState)}</span>
            </div>
        </button>
    )
}