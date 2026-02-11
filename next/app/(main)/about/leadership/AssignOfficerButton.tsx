"use client"

import { useEffect, useState } from "react";
import { OfficerPosition } from "./team";
import { UserPlus } from "lucide-react";

interface AssignOfficerButtonProps {
    position: OfficerPosition,
    openAssignModal: () => void,
    setSelectedPosition: (position: OfficerPosition) => void
}

/**
 * Component that reveals Assign button to officers for empty positions
 */
export default function AssignOfficerButton({ position, openAssignModal, setSelectedPosition }: AssignOfficerButtonProps) {
    const [isOfficer, setIsOfficer] = useState(false);
    
    useEffect(() => {
        userStatus();  
    }, []);
    
    const userStatus = async () => {
        const response = await fetch("/api/authLevel");
        const userData = await response.json();
        setIsOfficer(userData.isOfficer);
    }

    if(isOfficer){
        return (
            <div className="flex gap-2 justify-center">
                <button 
                    className="flex items-center gap-1.5 text-xs bg-chart-7/20 hover:bg-chart-7/30 rounded-md px-2.5 py-1.5 text-foreground transition-colors" 
                    onClick={() => {setSelectedPosition(position); openAssignModal()}}
                >
                    <UserPlus size={12} />
                    Assign Officer
                </button>
            </div>
        )
    }
    else{
        return null;
    }
}
