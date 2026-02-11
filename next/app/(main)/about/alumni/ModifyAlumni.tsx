"use client"

import { useEffect, useState } from "react";
import { AlumniMember } from "./alumni";
import { Pencil, Trash2 } from "lucide-react";

/**
 * alumniMember - An alumni
 * openDeleteModal - Function to open the delete modal form
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
 * Component that reveals Edit / Delete button to officers
 */
export default function ModifyAlumni({ alumniMember, openDeleteModal, openEditModal, setSelectedAlumni }: ModifyAlumniProps) {
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
                    className="flex items-center gap-1.5 text-xs bg-surface-2 hover:bg-surface-3 rounded-md px-2.5 py-1.5 text-foreground transition-colors" 
                    onClick={() => {setSelectedAlumni(alumniMember); openEditModal()}}
                >
                    <Pencil size={12} />
                    Edit
                </button>
                <button 
                    className="flex items-center gap-1.5 text-xs bg-destructive hover:bg-destructive/90 border border-black/20 rounded-md px-2.5 py-1.5 text-white transition-colors" 
                    onClick={() => {setSelectedAlumni(alumniMember); openDeleteModal()}}
                >
                    <Trash2 size={12} />
                    Remove
                </button>
            </div>
        )
    }
    else{
        return null;
    }
}
