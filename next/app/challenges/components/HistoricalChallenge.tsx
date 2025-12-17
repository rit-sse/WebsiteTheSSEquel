"use client";

import { useState }  from 'react';
import { CircleCheckBig, CircleDot, CircleSlash, CircleX} from 'lucide-react';
import { ChallengeState } from '../[id]/page';

interface ButtonProps {
    challengeName: string;
    problemState: ChallengeState;
}

export function HistoricalButton({ challengeName, problemState } : ButtonProps) {

    // Temporary solution, eventually we should lift up state and the dashboard
    // should allow one button at a time to be clicked and choose the most recent
    // one to be selected by default
    const [isSelected, setSelected] = useState(false);

    /**
     * Buttons have an icon based on whether the user has solved, attemped, not 
     * attemped, or revealed the solution to, any particular problem
     * The icon should be white if the button is selected, because selected buttons
     * have a gradient background, while other buttons have a white background
     */
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

    /**
     * This becomes the bg-gradient-to-r element of the wrapper button element
     */
    function getLightGradientFromState() {
        switch (problemState) {
            case "solved":
                return "from-[#ffffff] to-[#00D564]"
            case "attempted":
                return "from-[#ffffff] to-[#e7c756]"
            case "revealed":
                return "from-[#ffffff] to-[#df3a11]"
            default:
                return "from-[#ffffff] to-[#7a7a7a]"
        }
    }

    function getFullGradientFromState() {
        switch (problemState) {
            case "solved":
                return "from-[#82EAB3] to-[#00D564]"
            case "attempted":
                return "from-[#F5DA89] to-[#e7c756]"
            case "revealed":
                return "from-[#E77C61] to-[#df3a11]"
            default:
                return "from-[#B8B8B8] to-[#7a7a7a]"
        }
    }

    /**
     * White background if not selected, if selected there is no background as
     * we want the outer gradient to display on the background as well
     */
    function getBackgroundFromState() {
        return isSelected ? `bg-gradient-to-r ${getFullGradientFromState()}` : "bg-white/[0.95]";
    }

    const gradientClass = `flex rounded-2xl w-full 
                    bg-gradient-to-r ${isSelected ? getLightGradientFromState() : getFullGradientFromState()}
                    shadow-lg p-[2px]`

    const backgroundClass = `${getBackgroundFromState()} transition-shadow
                            rounded-[14px] flex flex-row justify-between 
                            h-10 w-full items-center`

    return (
        // "flex rounded-xl mx-auto bg-gradient-to-tr from-red-400 via-orange-400 to-rose-400 p-[2px] shadow-lg"
        <button className={gradientClass} onClick={() => setSelected(!isSelected)}>
                <div className={backgroundClass}>
                <span className={`flex-1 text-left overflow-hidden whitespace-nowrap text-ellipsis pl-4 pr-2 ${isSelected ? "text-white" : "text-black"}`}>{challengeName}</span>
                <span className="flex pr-3">{getIconFromState(problemState)}</span>
            </div>
        </button>
    )
}