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
    openReplaceModal: () => void,
    openEditModal: () => void,
    setSelectedAlumni: (alumniMember: AlumniMember) => void
}

/**
 * Component that reveals Edit / Replace button to alumni
 */
export default function ModifyAlumni({ alumniMember, openReplaceModal, openEditModal, setSelectedAlumni }: ModifyAlumniProps) {
    const [isAlumni, setIsAlumni] = useState(false);
    
    useEffect(() => {
        userStatus();  
    }, []);
    
    const userStatus = async () =>{
        const response = await fetch("/api/authLevel");
        const userData = await response.json();
        setIsAlumni(userData.isAlumni);
    }

    if(isAlumni){
        return (
            <div className="flex flex-row justify-center gap-4">
                <button className="text-sm bg-secondary hover:bg-primary rounded-md active:bg-neutral text-base-100 p-1" onClick={() => {setSelectedAlumni(alumniMember); openEditModal()}}>
                    Edit
                </button>
                <button className="text-sm bg-secondary hover:bg-primary rounded-md active:bg-neutral text-base-100 p-1" onClick={() => {setSelectedAlumni(alumniMember); openReplaceModal()}}>
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
