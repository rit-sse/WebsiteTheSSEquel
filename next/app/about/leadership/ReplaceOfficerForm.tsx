"use client"

import { useEffect, useState } from "react";
import { TeamMember } from "./team";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ModalFooter } from "@/components/ui/modal";

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

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="user_email">Officer Email</Label>
				<Input 
					id="user_email"
					type="email" 
					name="user_email" 
					placeholder="RIT Email" 
					value={formData.user_email} 
					onChange={handleChange} 
					required 
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="start_date">Start Date</Label>
				<Input 
					id="start_date"
					type="date" 
					name="start_date" 
					value={formData.start_date} 
					onChange={handleChange} 
					required 
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="end_date">End Date</Label>
				<Input 
					id="end_date"
					type="date" 
					name="end_date" 
					value={formData.end_date} 
					onChange={handleChange} 
					required 
				/>
			</div>
			<ModalFooter>
				<Button type="button" variant="neutral" onClick={closeModel}>Cancel</Button>
				<Button type="submit">Replace Officer</Button>
			</ModalFooter>
			{error && <p className="text-destructive text-center text-sm">{error}</p>}
		</form>
	)
}
