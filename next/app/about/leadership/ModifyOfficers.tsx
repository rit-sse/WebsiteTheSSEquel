"use client"

import { useEffect, useState } from "react";
import { Team, TeamMember } from "./team";
import Image from 'next/image';

/**
 * teamMember - An officer
 * openReplaceModal - Function to open the replace modal form
 * openEditModal - Function to open the edit modal form
 * setSelectedOfficer - Function to set the selectedOfficer state
 */
interface ModifyOfficerProps {
    teamMember?: TeamMember,
    openReplaceModal: () => void,
    openEditModal: () => void,
    setSelectedOfficer: (teamMember: TeamMember) => void,
    position: string
}

/**
 * Component that reveals Edit / Replace button to officers
 */
export default function ModifyOfficers({ teamMember, openReplaceModal, openEditModal, setSelectedOfficer, position }: ModifyOfficerProps) {
    const [isOfficer, setIsOfficer] = useState(false);
    
    useEffect(() => {
        userStatus();  
    }, []);
    
    const userStatus = async () =>{
        const response = await fetch("http://localhost:3000/api/authLevel");
        const userData = await response.json();
        setIsOfficer(userData.isOfficer);
    }

    const clearSelectedOfficer = async () =>{
        console.log(teamMember?.officer_id);
        return await fetch('/api/officer', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: teamMember?.user_id,
                active: false
            })
        }).then((res) => console.log(res.text()));
    }

    if(isOfficer){
        if(!teamMember){
            return (
                <button className="text-sm bg-secondary hover:bg-primary rounded-md active:bg-neutral text-base-100 p-1" onClick={() => {setSelectedOfficer({title: position} as TeamMember); openReplaceModal()}}>Set Officer</button>
            )
        }
        return (
            <div className="flex flex-row justify-evenly">
                <button className="text-sm bg-secondary hover:bg-primary rounded-md active:bg-neutral text-base-100 p-1" onClick={() => {setSelectedOfficer(teamMember); openEditModal()}}>
                    Edit
                </button>
                <button className="text-sm bg-secondary hover:bg-primary rounded-md active:bg-neutral text-base-100 p-1" onClick={() => {setSelectedOfficer(teamMember); openReplaceModal()}}>
                    Replace
                </button>
                <button className="text-sm bg-secondary hover:bg-primary rounded-md active:bg-neutral text-base-100 p-1" onClick={() => {setSelectedOfficer(teamMember); clearSelectedOfficer()}}>
                    Clear
                </button>
            </div>
        )
    }
    return (
        <span></span>
    )
}