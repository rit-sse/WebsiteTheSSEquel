"use client";

import { useState }  from 'react';
import { CircleCheckBig, CircleDot, CircleSlash, CircleX} from 'lucide-react';

interface ButtonProps {
    challengeName: string;
    problemState: "attempted" | "solved" | "unattempted" | "revealed";
}

export function HistoricalButton({ challengeName, problemState } : ButtonProps) {

    const [isSelected, setSelected] = useState(false);

    function getIconFromState(problemState: string) {
        let color = "white";
        
        switch (problemState) {
            case "solved":
                if (!isSelected) {
                    color = "#0ed76c"
                }
                return <CircleCheckBig color={color}/>
            case "attempted":
                if (!isSelected) {
                    color = "#e6c24b"
                }
                return <CircleDot  color={color}/>
            case "revealed":
                if (!isSelected) {
                    color = "#df3a11"
                }
                return <CircleX color={color}/>
            default:
                if (!isSelected) {
                    color = "#6d6d6d"
                }
                return <CircleSlash color={color}/>
        }
    }

    function getGradientFromState(problemState: string) {
        switch (problemState) {
            case "solved":
                return "from-[#e5f9eb] to-[#00d564]"
            case "attempted":
                return "from-[#fcf7e5] to-[#e7c756]"
            case "revealed":
                return "from-[#fde3e3] to-[#df3a11]"
            default:
                return "from-[#ececec] to-[#7a7a7a]"
        }
    }

    function getBackgroundFromState() {
        return isSelected ? "" : "bg-white";
    }

    const gradientClass = `flex rounded-full mx-auto 
                    bg-gradient-to-r ${getGradientFromState(problemState)}
                    shadow-lg p-0.5`

    const backgroundClass = `${getBackgroundFromState()} transition-shadow shadow-md hover:shadow-lg 
                            rounded-full flex flex-row justify-between 
                            h-10 w-56 items-center`

    return (
        // "flex rounded-xl mx-auto bg-gradient-to-tr from-red-400 via-orange-400 to-rose-400 p-[2px] shadow-lg"
        <button className={gradientClass} onClick={() => setSelected(!isSelected)}>
                <div className={backgroundClass}>
                <span className="flex-1 text-left overflow-hidden whitespace-nowrap text-ellipsis pl-3">{challengeName}</span>
                <span className="flex pr-3">{getIconFromState(problemState)}</span>
            </div>
        </button>
    )
}