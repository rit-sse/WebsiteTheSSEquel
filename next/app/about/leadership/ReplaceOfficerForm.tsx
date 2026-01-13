"use client"

import { useEffect, useState } from "react";
import { TeamMember } from "./team";

/**
 * open - State of replace form modal
 * teamMember - Currently selected officer to be replaced
 * getOfficers - Function to get active officers, used to update the list
 * closeModal - Function to close the form's modal
 */
interface OfficerFormProps {
	open: boolean,
	teamMember?: TeamMember,
	getOfficers: () => void,
	closeModel: () => void
}

/**
 * Form to replace an existing officer in a current position
 */
export default function ReplaceOfficerForm({ open, teamMember, getOfficers, closeModel }: OfficerFormProps) {
	const [formData, setFormData] = useState({
		user_email: '',
		start_date: '',
		end_date: '',
		position: ''
	});
	const [error, setError] = useState("")

	// Fill form the selected officer's position
	useEffect(() => {
		setFormData((prevData) => ({
			...prevData,
			position: teamMember?.title ?? ''
		}));
	}, [teamMember]);

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
			position: ''
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
					user_email: formData.user_email,
					start_date: new Date(formData.start_date).toISOString(),
					end_date: new Date(formData.end_date).toISOString(),
					position: formData.position
				}),
			});
			if (response.ok) {
				console.log('Officer created successfully');
				getOfficers();
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
				<label>Officer Email</label>
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
			<button type="submit" className="p-2 bg-secondary text-foreground hover:bg-primary rounded">Submit</button>
			<label className="text-error text-center text-sm">{error}</label>
		</form>
	)
}
