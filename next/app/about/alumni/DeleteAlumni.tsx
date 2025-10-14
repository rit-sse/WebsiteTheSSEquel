"use client"

import { useEffect, useState } from "react";
import { AlumniMember } from "./alumni";

interface DeleteAlumniProps {
    open: boolean;
    alumniMember?: AlumniMember;
    fetchData: () => Promise<void>;
    closeModal: () => void // closeModal - Function to close the form's modal
}

export const DeleteAlumniButton: React.FC<DeleteAlumniProps> = ({ open, alumniMember, fetchData, closeModal  }) => {
    const [alumni_id, setAlumniID] = useState("");

    const [formData, setFormData] = useState({
        alumni_id: ''
	});

	const [error, setError] = useState("")

    // Fill form with current 
    //  data
    useEffect(() => {
        fillForm();
    }, [alumniMember])

    // Fill form with current alumni data when it is closed to undo any unsubmitted changes
    useEffect(() => {
        if(!open){
            fillForm();
        }
    }, [open])

    const fillForm = () => {
        setFormData({
            alumni_id: alumniMember?.alumni_id ?? '',
        });
    }

	const handleCancel = () => {
    //     setName("");
    //     setTitle("");
    //     setQuote("");
    //     setPreviousRoles("");
    //     setDescription("");
    //     setLinkedin("");
    //     setGithub("");
    //     setEmail("");
    //     setStartDate("");
    //     setEndDate("");
	};

	const handleDelete = async () => {
		try {
		const response = await fetch("/api/alumni", {
			method: "DELETE",
			body: JSON.stringify({ id: alumni_id }),
		});

		if (response.ok) {
			handleCancel();
			(document.getElementById("delete-alumni") as HTMLDialogElement).close();
			fetchData();
		}
		} catch (error) {}
	};

    return (
        <form onSubmit={closeModal} className="flex flex-col gap-4">
            <p className="font-bold py-4 text-lg">
                 Are you sure you want to delete this Alumni?
             </p>
            <div className="modal-action">
                <button
                className="btn"
                onClick={() => {
                    handleDelete();
                    // (
                    // document.getElementById( "delete-alumni") as HTMLDialogElement
                    // ).close();
                }}
                >
                Delete
                </button>

                <button
                className="btn"
                onClick={() => {
                    handleCancel();
                    // (
                    // document.getElementById(
                    //     "delete-alumni"
                    // ) as HTMLDialogElement
                    // ).close();
                }}
                >
                Cancel
                </button>
            </div>
        </form>
    )
};

export default DeleteAlumniButton;

