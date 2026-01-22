"use client"

import { useEffect, useState } from "react";
import { TeamMember } from "./team";
import { Pencil, RefreshCw } from "lucide-react";

/**
 * teamMember - An officer
 * openReplaceModal - Function to open the replace modal form
 * openEditModal - Function to open the edit modal form
 * setSelectedOfficer - Function to set the selectedOfficer state
 */
interface ModifyOfficerProps {
    teamMember: TeamMember,
    openReplaceModal: () => void,
    openEditModal: () => void,
    setSelectedOfficer: (teamMember: TeamMember) => void
}

/**
 * Component that reveals Edit / Replace button to officers
 */
export default function ModifyOfficers({ teamMember, openReplaceModal, openEditModal, setSelectedOfficer }: ModifyOfficerProps) {
    const [isOfficer, setIsOfficer] = useState(false);
    
    useEffect(() => {
        userStatus();  
    }, []);
    
    const userStatus = async () =>{
        const response = await fetch("/api/authLevel");
        const userData = await response.json();
        setIsOfficer(userData.isOfficer);
    }

    if(isOfficer){
        return (
            <div className="flex gap-2 justify-center">
                <button 
                    className="flex items-center gap-1.5 text-xs bg-surface-2 hover:bg-surface-3 rounded-md px-2.5 py-1.5 text-foreground transition-colors" 
                    onClick={() => {setSelectedOfficer(teamMember); openEditModal()}}
                >
                    <Pencil size={12} />
                    Edit
                </button>
                <button 
                    className="flex items-center gap-1.5 text-xs bg-surface-2 hover:bg-surface-3 rounded-md px-2.5 py-1.5 text-foreground transition-colors" 
                    onClick={() => {setSelectedOfficer(teamMember); openReplaceModal()}}
                >
                    <RefreshCw size={12} />
                    Replace
                </button>
            </div>
        )
    }
    else{
        return null;
    }
}
