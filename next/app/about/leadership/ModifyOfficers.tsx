"use client"

import { useEffect, useState } from "react";
import { TeamMember } from "./team";

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
        const response = await fetch("http://localhost:3000/api/authLevel");
        const userData = await response.json();
        setIsOfficer(userData.isOfficer);
    }

    if(!isOfficer){ // Switch this later
        return (
            <div className="flex flex-row justify-evenly">
                <button onClick={() => {setSelectedOfficer(teamMember); openEditModal()}}>
                    E
                </button>
                <button onClick={() => {setSelectedOfficer(teamMember); openReplaceModal()}}>
                    R
                </button>
            </div>
        )
    }
    else{
        return (
            <span></span>
        )
    }
}