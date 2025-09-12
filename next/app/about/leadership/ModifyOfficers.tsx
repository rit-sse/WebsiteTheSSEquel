"use client"

import { useEffect, useState } from "react";
import { TeamMember } from "./team";
import Image from 'next/image';

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

    if(isOfficer){
        return (
            <div className="flex flex-row justify-evenly">
                <button className="text-sm bg-secondary hover:bg-primary rounded-md active:bg-neutral text-base-100 p-1" onClick={() => {setSelectedOfficer(teamMember); openEditModal()}}>
                    Edit
                </button>
                <button className="text-sm bg-secondary hover:bg-primary rounded-md active:bg-neutral text-base-100 p-1" onClick={() => {setSelectedOfficer(teamMember); openReplaceModal()}}>
                    Replace
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
