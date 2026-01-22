"use client"

import { useEffect, useState } from "react";
import { AlumniMember } from "./alumni";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModalFooter } from "@/components/ui/modal";

interface AlumniFormProps {
    open: boolean, // open - State of edit form modal
    alumniMember?: AlumniMember, // alumniMember - Currently selected alumni to be edited
    getAlumni: () => void, // getAlumni - Function to get active alumni, used to update the list
    closeModal: () => void // closeModal - Function to close the form's modal
}

export default function EditAlumniForm({ open, alumniMember, getAlumni, closeModal }: AlumniFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        linkedIn: '',
        gitHub: '',
        description: '',
        start_date: '',
        end_date: '',
        quote: '',
        previous_roles: '',
        image: '',
    });
    const [error, setError] = useState("")

    // Fill form with current alumni data
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
            name: alumniMember?.name ?? '',
            email: alumniMember?.email ?? '',
            linkedIn: alumniMember?.linkedin ?? '',
            gitHub: alumniMember?.github ?? '',
            description: alumniMember?.description ?? '',
            quote: alumniMember?.quote ?? '',
            previous_roles: alumniMember?.previous_roles ?? '',
            start_date: alumniMember?.start_date ?? '',
            end_date: alumniMember?.end_date ?? '',
            image: alumniMember?.image ?? '',
        });
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
          ...prevData, 
          [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {

            let linkedInValue = formData.linkedIn;
            if (linkedInValue.startsWith("www.")) {
                linkedInValue = "https://" + linkedInValue;
            }

            let gitHubValue = formData.gitHub;
            if (gitHubValue.startsWith("www.")) {
                gitHubValue = "https://" + gitHubValue;
            }

            // Call to alumni route to update alumni's data
            const alumniResponse = await fetch('/api/alumni', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: alumniMember?.alumni_id,
                    email: formData.email,
                    linkedIn: linkedInValue,
                    gitHub: gitHubValue,
                    description: formData.description,
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    quote: formData.quote,
                    previous_roles: formData.previous_roles,
                    image: formData.image,
                })
            })
            

            if (!alumniResponse.ok) {
                const text = await alumniResponse.text();
                throw new Error(`Error: ${text}`);
            }

            if (alumniResponse.ok) {
                getAlumni();
                closeModal();
            } 
            else {
                const errorDataUser = await alumniResponse.text();
                console.log(`Error: ${errorDataUser}`);
                setError(errorDataUser);
            }

        } 
        catch (error) {
          console.error('Error submitting form:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
                <Label htmlFor="email">Alumni Email</Label>
                <Input 
                    id="email"
                    type="email" 
                    name="email" 
                    placeholder="Email" 
                    value={formData.email} 
                    onChange={handleChange}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="linkedIn">LinkedIn</Label>
                <Input 
                    id="linkedIn"
                    name="linkedIn" 
                    placeholder="LinkedIn Profile Link" 
                    value={formData.linkedIn} 
                    onChange={handleChange}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="gitHub">GitHub</Label>
                <Input 
                    id="gitHub"
                    name="gitHub" 
                    placeholder="GitHub Link" 
                    value={formData.gitHub} 
                    onChange={handleChange}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                    id="description"
                    name="description" 
                    placeholder="Description about alumni..." 
                    value={formData.description} 
                    onChange={handleChange}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="image">Image URL</Label>
                <Input 
                    id="image"
                    name="image" 
                    placeholder="Image URL" 
                    value={formData.image} 
                    onChange={handleChange}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input 
                    id="start_date"
                    name="start_date" 
                    placeholder="e.g., Fall 2023" 
                    value={formData.start_date} 
                    onChange={handleChange}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input 
                    id="end_date"
                    name="end_date" 
                    placeholder="e.g., Spring 2024" 
                    value={formData.end_date} 
                    onChange={handleChange}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="quote">Quote</Label>
                <Input 
                    id="quote"
                    name="quote" 
                    placeholder="Alumni quote..." 
                    value={formData.quote} 
                    onChange={handleChange}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="previous_roles">Previous Roles</Label>
                <Input 
                    id="previous_roles"
                    name="previous_roles" 
                    placeholder="Alumni's previous role(s)..." 
                    value={formData.previous_roles} 
                    onChange={handleChange}
                />
            </div>
            <ModalFooter>
                <Button type="button" variant="neutral" onClick={closeModal}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
            </ModalFooter>
            {error && <p className="text-destructive text-center text-sm">{error}</p>}
        </form>
    )
}
