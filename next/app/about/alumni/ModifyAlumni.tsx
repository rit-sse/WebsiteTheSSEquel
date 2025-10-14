"use client"

import { useEffect, useState } from "react";
import { AlumniMember } from "./alumni";
import Image from 'next/image';

/**
 * alumniMember - An alumni
 * openReplaceModal - Function to open the replace modal form
 * openEditModal - Function to open the edit modal form
 * setSelectedAlumni - Function to set the selectedAlumni state
 */
interface ModifyAlumniProps {
    alumniMember: AlumniMember,
    openDeleteModal: () => void,
    openEditModal: () => void,
    setSelectedAlumni: (alumniMember: AlumniMember) => void
}

/**
 * Component that reveals Edit / Replace button to alumni
 */
export default function ModifyAlumni({ alumniMember, openDeleteModal, openEditModal, setSelectedAlumni }: ModifyAlumniProps) {
    const [isOfficer, setIsOfficer] = useState(false);
    
    useEffect(() => {
        userStatus();  
    }, []);
    
    const userStatus = async () =>{ // checks if the current user is an officer
        const response = await fetch("/api/authLevel");
        const userData = await response.json();
        setIsOfficer(userData.isOfficer);
    }

    if(isOfficer){
        return (
            <div className="flex flex-row justify-center gap-4">
                <button className="text-sm bg-secondary hover:bg-primary rounded-md active:bg-neutral text-base-100 p-1" onClick={() => {setSelectedAlumni(alumniMember); openEditModal()}}>
                    Edit
                </button>
                <button className="text-sm bg-secondary hover:bg-primary rounded-md active:bg-neutral text-base-100 p-1" onClick={() => {setSelectedAlumni(alumniMember); openDeleteModal()}}>
                    Delete
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
