"use client"

import { useState } from "react";
import { AlumniMember } from "./alumni";
import { Button } from "@/components/ui/button";
import { ModalFooter } from "@/components/ui/modal";

interface DeleteAlumniProps {
    open: boolean; // open - State of delete form modal
    alumniMember?: AlumniMember; // alumniMember - Currently selected alumni to be deleted
    fetchData: () => Promise<void>; // fetchData - Function to refresh alumni list
    closeModal: () => void // closeModal - Function to close the form's modal
}

export const DeleteAlumniButton: React.FC<DeleteAlumniProps> = ({ alumniMember, fetchData, closeModal }) => {
    const [error, setError] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        setError("");
        setIsDeleting(true);
        try {
            if (!alumniMember?.alumni_id) {
                setError("Missing alumni_id for this alumni.");
                setIsDeleting(false);
                return;
            }

            // Call to alumni route to delete alumni's user data
            const response = await fetch("/api/alumni", {
                method: "DELETE",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: alumniMember.alumni_id }),
            });

            if (response.ok) {
                await fetchData();
                closeModal();
            } else {
                const errorText = await response.text();
                setError(errorText || "Failed to delete alumni");
            }
        } catch (error) {
            console.error('Error deleting alumni:', error);
            setError("An error occurred while deleting");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-foreground">
                Are you sure you want to remove <strong>{alumniMember?.name}</strong> from the alumni list? This action cannot be undone.
            </p>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <ModalFooter>
                <Button type="button" variant="neutral" onClick={closeModal}>
                    Cancel
                </Button>
                <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={isDeleting}
                >
                    {isDeleting ? "Removing..." : "Remove Alumni"}
                </Button>
            </ModalFooter>
        </div>
    )
};

export default DeleteAlumniButton;

