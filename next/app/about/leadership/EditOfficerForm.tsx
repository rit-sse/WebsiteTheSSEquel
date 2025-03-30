"use client"

import { useEffect, useState } from "react";
import { TeamMember } from "./team";

interface OfficerFormProps {
    open: boolean,
    teamMember?: TeamMember,
    getOfficers: () => void,
    closeModal: () => void
}

export default function EditOfficerForm({ open, teamMember, getOfficers, closeModal }: OfficerFormProps) {
    const [formData, setFormData] = useState({
        user_email: '',
        linkedIn: '',
        gitHub: '',
        description: ''
    });
    const [error, setError] = useState("")

    useEffect(() => {
        setFormData((prevData) => ({
            ...prevData,
            position: teamMember?.title ?? ''
        }));
    }, [teamMember]);

    useEffect(() => {
        if(!open){
            clearForm();
        }
    }, [open])

    const clearForm = () => {
        setFormData({
            user_email: '',
            linkedIn: '',
            gitHub: '',
            description: ''
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
          const response = await fetch('/api/officer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // user_email: formData.user_email,
                // start_date: new Date(formData.start_date).toISOString(),
                // end_date: new Date(formData.end_date).toISOString(),
                // position: formData.position
            }),
        });
        if (response.ok) {
            console.log('Officer changed successfully');
            getOfficers();
            closeModal();
        } 
        else {
            const errorData = await response.text();
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
                <input name="description" placeholder="Short description about officer..." value={formData.description} onChange={handleChange}/>
            </div>
            <button type="submit" className="p-2 bg-secondary text-base-content hover:bg-primary rounded">Submit</button>
            <label className="text-error text-center text-sm">{error}</label>
        </form>
    )
}