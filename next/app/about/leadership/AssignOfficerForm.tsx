"use client"

import { useEffect, useState } from "react";
import { OfficerPosition } from "./team";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ModalFooter } from "@/components/ui/modal";

interface AssignOfficerFormProps {
	open: boolean,
	position?: OfficerPosition,
	getOfficers: () => void,
	closeModal: () => void
}

/**
 * Form to assign a new officer to an empty position
 */
export default function AssignOfficerForm({ open, position, getOfficers, closeModal }: AssignOfficerFormProps) {
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
		setError("");
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
		
		if (!position) {
			setError("No position selected");
			return;
		}

		try {
			const response = await fetch('/api/officer', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					user_email: formData.user_email,
					start_date: new Date(formData.start_date).toISOString(),
					end_date: new Date(formData.end_date).toISOString(),
					position: position.title
				}),
			});
			if (response.ok) {
				console.log('Officer assigned successfully');
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
			setError("An error occurred while assigning the officer");
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<p className="text-sm text-muted-foreground">
				Assigning officer to: <strong>{position?.title}</strong>
			</p>
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
				<Button type="button" variant="neutral" onClick={closeModal}>Cancel</Button>
				<Button type="submit">Assign Officer</Button>
			</ModalFooter>
			{error && <p className="text-destructive text-center text-sm">{error}</p>}
		</form>
	)
}
