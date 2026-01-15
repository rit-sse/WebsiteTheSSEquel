"use client"

import { useEffect, useState } from "react";
import AlumniCard from "./AlumniCard";
import { Modal } from "@/components/ui/modal";
import { Team, AlumniMember } from "./alumni";
import ModifyAlumni from "./ModifyAlumni";
import EditAlumniForm from "./EditAlumniForm";
import CreateAlumniButton from "./MakeNewAlumni";
import DeleteAlumniButton from "./DeleteAlumni";

export default function Leadership() {
	// States to manage opening/closing of modals
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	// State of the current selected alumni (being edited / replaced)
	const [selectedAlumni, setSelectedAlumni] = useState<AlumniMember>();
	// State list of all active alumni
	const [teamData, setTeamData] = useState<Team>({ alumni_member: []});

	// Get all active alumni when page opens
	useEffect(() => {
		getAlumni();
	}, []);

	const getAlumni = async () => {
		var team: Team = { alumni_member: []};
		try {
			const response = await fetch('/api/alumni/active');
			if (!response.ok) {
				throw new Error('Failed to fetch alumni');
			}
			const data = await response.json();
			console.log(data.user)

			// Map alumni to AlimniMember
			team.alumni_member = data
				.map((alumni: any) => ({
					alumni_id: alumni.id,
					name: alumni.name,
					image: alumni.image,
					email: alumni.email,
					linkedin: alumni.linkedIn,
					github: alumni.gitHub,
					description: alumni.description,
					quote: alumni.quote,
					previous_roles: alumni.previous_roles,
					start_date: alumni.start_date,
					end_date: alumni.end_date
				}));

		} catch (error) {
			console.error('Error:', error);
		}
		setTeamData(team);
	};

	return (
		<>
			<section className="mt-16">
				{/* Modals for editing and deleting alumni */}
				<Modal open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Alumni">
					<DeleteAlumniButton open={editOpen} alumniMember={selectedAlumni} fetchData={getAlumni} closeModal={() => setDeleteOpen(false)}/>
				</Modal>
				<Modal open={editOpen} onOpenChange={setEditOpen} title="Edit Alumni">
					<EditAlumniForm open={editOpen} alumniMember={selectedAlumni} getAlumni={getAlumni} closeModal={() => setEditOpen(false)} />
				</Modal>
				<div className="max-w-screen-xl mx-auto px-4 text-center md:px-8">
					<div className="content-center">
						{/* Meet our team */}
						<div className="max-w-xl mx-auto">
							<h1 className="text-primary">
								Meet our Alumni
							</h1>
							<p className="mt-3 text-xl leading-8 text-center">
								A dedicated page for alumni of the SSE
							</p>
							<div className="mt-4">
								<CreateAlumniButton fetchData={getAlumni} />
							</div>
						</div>
					</div>
					
					{/* Alumni */}
					<div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
						{teamData.alumni_member.map((member, idx) => (
							<AlumniCard key={idx} alumniMember={member}>
								<ModifyAlumni 
									alumniMember={member} 
									openDeleteModal={() => setDeleteOpen(true)} 
									openEditModal={() => setEditOpen(true)} 
									setSelectedAlumni={setSelectedAlumni} 
								/>
							</AlumniCard>
						))}
					</div>
				</div>
			</section>
		</>
	);
}
