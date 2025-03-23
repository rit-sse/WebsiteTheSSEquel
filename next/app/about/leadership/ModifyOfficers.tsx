"use client"

import { useEffect, useState } from "react";
import { TeamMember } from "./team";

interface ModifyOfficerProps {
    teamMember: TeamMember,
    openModal: () => void,
    setSelectedOfficer: (teamMember: TeamMember) => void
}

export default function ModifyOfficers({ teamMember, openModal, setSelectedOfficer }: ModifyOfficerProps) {
    const [isOfficer, setIsOfficer] = useState(false);
    
    useEffect(() => {
        userStatus();  
    }, []);
    
    const userStatus = async () =>{
        const response = await fetch("http://localhost:3000/api/authLevel");
        const userData = await response.json();
        setIsOfficer(userData.isOfficer);
    }

    const replaceClick = () => {
        setSelectedOfficer(teamMember);
        openModal();
    }

    if(!isOfficer){ // Switch this later
        return (
            <div className="flex flex-row justify-between">
                <button>E</button>
                <button onClick={replaceClick}>R</button>
            </div>
        )
    }
    else{
        return (
            <span></span>
        )
    }
}