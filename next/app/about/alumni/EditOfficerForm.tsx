"use client"

import { useEffect, useState } from "react";
import { AlumniMember } from "./alumni";


interface OfficerFormProps {
    open: boolean, // open - State of edit form modal
    alumniMember?: AlumniMember, // alumniMember - Currently selected officer to be edited
    getOfficers: () => void, // getOfficers - Function to get active officers, used to update the list
    closeModal: () => void // closeModal - Function to close the form's modal
}

export default function EditOfficerForm({ open, alumniMember, getOfficers, closeModal }: OfficerFormProps) {
    const [formData, setFormData] = useState({
        user_email: '',
        linkedIn: '',
        gitHub: '',
        description: '',
        start_date: '',
        end_date: ''
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
            user_email: alumniMember?.email ?? '',
            linkedIn: alumniMember?.linkedin ?? '',
            gitHub: alumniMember?.github ?? '',
            description: alumniMember?.desc ?? '',
            start_date: '',
            end_date: ''
        });
    }

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
          ...prevData,
          [name]: value,
        }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError("");
        try {

            if (!alumniMember?.user_id) {
                setError("Misisng user_id for this alumni.");
                return;
            }

            let linkedInValue = formData.linkedIn;
            if (linkedInValue.startsWith("www.")) {
                linkedInValue = "https://" + linkedInValue;
            }

            let gitHubValue = formData.gitHub;
            if (gitHubValue.startsWith("www.")) {
                gitHubValue = "https://" + gitHubValue;
            }
            // Call to user route to update officer's user data
            const userResponse = await fetch('/api/user', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: alumniMember?.user_id,
                    user_email: formData.user_email,
                    linkedIn: linkedInValue,
                    gitHub: gitHubValue,
                    description: formData.description
                }),
            });

            if (!userResponse.ok) {
                const text = await userResponse.text();
                throw new Error(`Error: ${text}`);
            }

            // Call to officer route if the start and end dates are modified
            if (formData.start_date != '' && formData.end_date != ''){
                const officerResponse = await fetch('/api/officer', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: alumniMember?.alumni_id,
                        start_date: new Date(formData.start_date).toISOString(),
                        end_date: new Date(formData.end_date).toISOString() 
                    })
                })
            }
            
            if (userResponse.ok) {
                getOfficers();
                closeModal();
            } 
            else {
                const errorData = await userResponse.text();
                console.log(`Error: ${errorData}`);
                setError(errorData);
            }
        } 
        catch (error) {
          console.error('Error submitting form:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col">
                <label>Officer Email</label>
                <input type="email" name="user_email" placeholder="RIT Email" value={formData.user_email} onChange={handleChange}/>
            </div>
            <div className="flex flex-col">
                <label>LinkedIn</label>
                <input name="linkedIn" placeholder="LinkedIn Profile Link" value={formData.linkedIn} onChange={handleChange}/>
            </div>
            <div className="flex flex-col">
                <label>GitHub</label>
                <input name="gitHub" placeholder="GitHub Link" value={formData.gitHub} onChange={handleChange}/>
            </div>
            <div className="flex flex-col">
                <label>Description</label>
                <input name="description" placeholder="Description about officer..." value={formData.description} onChange={handleChange}/>
            </div>
            <div className="flex flex-col">
                <label>Start Date</label>
                <input type="date" name="start_date" value={formData.start_date} onChange={handleChange}/>
            </div>
            <div className="flex flex-col">
                <label>End Date</label>
                <input type="date" name="end_date" value={formData.end_date} onChange={handleChange}/>
            </div>
            <button type="submit" className="p-2 bg-secondary text-base-content hover:bg-primary rounded">Submit</button>
            <label className="text-error text-center text-sm">{error}</label>
        </form>
    )
}
