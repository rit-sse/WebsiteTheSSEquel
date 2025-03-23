"use client"

import { useState } from "react";

export default function OfficerForm() {
    const [formData, setFormData] = useState({
        user_email: '',
        start_date: '',
        end_date: '',
        position: '',
    });

    const positions = ['President', 'Vice President', 'Treasurer', 'Secretary', 'Events', 'Marketing', 'Mentoring', 'Public Relations', 'Student Outreach', 'Talks', 'Tech', 'Tech Apprentice'];

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
          ...prevData,
          [name]: value,
        }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
          const response = await fetch('/api/officer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        if (response.ok) {
            console.log('Officer created successfully');
        } 
        else {
            const errorData = await response.json();
            console.log(`Error: ${errorData.message}`);
        }
        } 
        catch (error) {
          console.error('Error submitting form:', error);
        }
    };

    return (
        <form onSubmit={(e: any) => { e.preventDefault(); console.log(formData); }} className="flex flex-col gap-4">
            <input type="email" name="user_email" placeholder="User Email" value={formData.user_email} onChange={handleChange} required/>
            <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required/>
            <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} />
            <select name="position" value={formData.position} onChange={handleChange} required>
                <option value="" disabled>Select Position</option>
                {positions.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
                ))}
            </select>
            <button type="submit" className="p-2 bg-secondary text-base-content hover:bg-primary rounded">Submit</button>
        </form>
    )
}