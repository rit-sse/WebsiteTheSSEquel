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
        let color = "text-white dark:text-neutral-50";
        
        switch (problemState) {
            case "solved":
                if (!isSelected) {
                    color = "text-[#0ed76c]"
                }
                return <CircleCheckBig className={color}/>
            case "attempted":
                if (!isSelected) {
                    color = "text-[#e6c24b]"
                }
                return <CircleDot className={color}/>
            case "revealed":
                if (!isSelected) {
                    color = "text-[#df3a11]"
                }
                return <CircleX className={color}/>
            default:
                if (!isSelected) {
                    color = "text-[#6d6d6d]"
                }
                return <CircleSlash className={color}/>
        }
    }

    /**
     * This function gives a gentler gradient that is the background of the
     * button when it is not selected
     */
    function getLightGradientFromState() {
        switch (problemState) {
            case "solved":
                return `from-[#ffffff] to-[#00D564] dark:from-[#007a36] dark:to-[#00d564]`
            case "attempted":
                return `from-[#ffffff] to-[#e7c756] dark:from-[#a67c1a] dark:to-[#e7c756]`
            case "revealed":
                return `from-[#ffffff] to-[#df3a11] dark:from-[#a83211] dark:to-[#df3a11]`
            default:
                return `from-[#ffffff] to-[#7a7a7a] dark:from-[#4a4a4a] dark:to-[#7a7a7a]`
        }
    }


    /**
     * This becomes the background of the button itself if selected, and makes up
     * the border of the button when it is not selected
     */
    function getFullGradientFromState() {
        switch (problemState) {
            case "solved":
                return `from-[#82eab3] to-[#00d564] dark:from-[#68bb8f] dark:to-[#00aa50]`
            case "attempted":
                return `from-[#f5da89] to-[#e7c756] dark:from-[#d9b84a] dark:to-[#c9a93c]`
            case "revealed":
                return `from-[#e77c61] to-[#df3a11] dark:from-[#b9634e] dark:to-[#b22e0e]`
            default:
                return `from-[#b8b8b8] to-[#7a7a7a] dark:from-[#939393] dark:to-[#626262]`
        }
    }

    /**
     * White background if not selected, if selected there is no background as
     * we want the outer gradient to display on the background as well
     */
    function getBackgroundFromState() {
        return (isSelected ? `bg-gradient-to-r ${getFullGradientFromState()}` : "bg-white/[0.95] dark:bg-black/[0.90]");
    }

    const gradientClass = `flex rounded-2xl w-full focus:outline-none
                    bg-gradient-to-r ${isSelected ? getLightGradientFromState() : getFullGradientFromState()}
                    shadow-md hover:shadow-lg p-[2px]`

    const backgroundClass = `${getBackgroundFromState()} transition-shadow
                            rounded-[14px] flex flex-row justify-between 
                            h-10 w-full items-center`

    return (
        // "flex rounded-xl mx-auto bg-gradient-to-tr from-red-400 via-orange-400 to-rose-400 p-[2px] shadow-lg"
        <button className={gradientClass} onClick={() => setSelected(!isSelected)}>
            <div className={backgroundClass}>
                <span className={`flex-1 text-left overflow-hidden whitespace-nowrap text-ellipsis pl-4 pr-2 ${isSelected ? "text-white dark:text-neutral-50" : "text-black dark:text-neutral-50"}`}>{challengeName}</span>
                <span className="flex pr-3">{getIconFromState(problemState)}</span>
            </div>
        </button>
    )
}