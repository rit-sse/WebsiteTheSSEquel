"use client"

import { useEffect, useState } from "react";
import { AlumniMember } from "./alumni";

/**
 * open - State of replace form modal
 * alumniMember - Currently selected alumni to be replaced
 * getAlumni - Function to get active alumni, used to update the list
 * closeModal - Function to close the form's modal
 */
interface AlumniFormProps {
	open: boolean,
	alumniMember?: AlumniMember,
	getAlumni: () => void,
	closeModel: () => void
}

/**
 * Form to replace an existing alumni in a current position
 */
export default function ReplaceAlumniForm({ open, alumniMember, getAlumni, closeModel }: AlumniFormProps) {
	const [formData, setFormData] = useState({
		user_email: '',
		start_date: '',
		end_date: '',
	});
	const [error, setError] = useState("")

	// Clear form if closed
	useEffect(() => {
		if (!open) {
			clearForm();
		}
	}, [open])

	const clearForm = () => {
		setFormData({
			user_email: '',
			start_date: '',
			end_date: '',
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
			const response = await fetch('/api/alumni', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					user_email: formData.user_email,
					start_date: new Date(formData.start_date).toISOString(),
					end_date: new Date(formData.end_date).toISOString(),
				}),
			});
			if (response.ok) {
				console.log('Alumni created successfully');
				getAlumni();
				closeModel();
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
				<label>Alumni Email</label>
				<input type="email" name="user_email" placeholder="RIT Email" value={formData.user_email} onChange={handleChange} required />
			</div>
			<div className="flex flex-col">
				<label>Start Date</label>
				<input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required />
			</div>
			<div className="flex flex-col">
				<label>End Date</label>
				<input type="date" name="end_date" value={formData.end_date} onChange={handleChange} required />
			</div>
			<button type="submit" className="p-2 bg-secondary text-base-content hover:bg-primary rounded">Submit</button>
			<label className="text-error text-center text-sm">{error}</label>
		</form>
	)
}
