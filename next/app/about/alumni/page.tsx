"use client"

import { useEffect, useState } from "react";
import AlumniCard from "./AlumniCard";
import AlumniFormModal from "./AlumniFormModal";
import { Team, AlumniMember } from "./alumni";
import ModifyAlumni from "./ModifyAlumni";
import EditAlumniForm from "./EditAlumniForm";
import CreateAlumniButton from "./MakeNewAlumni";
import DeleteAlumniButton from "./DeleteAlumni";
import { PersonCardBuilder } from "@/components/common/personcard/PersonCard";

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
					socials: {
						email: alumni.email,
						linkedin: alumni.linkedIn,
						github: alumni.gitHub,
					},
					description: alumni.description,
					quote: '"'+alumni.quote+'"',
					previous_roles: alumni.previous_roles,
					start_date: alumni.start_date,
					end_date: alumni.end_date
				}));

		} catch (error) {
			console.error('Error:', error);
		}
		setTeamData(team);
	};

	const personCardBuilder = new PersonCardBuilder<AlumniMember>()
			.buildIcon("image")
			.buildTitle("name")
			.buildInfo("quote")
			.buildBoldInfo("previous_roles")
			.buildBoldInfo("end_date")
			.buildSocials("socials");

	return (
		<>
			<section className="mt-16">
				{/* Modals for editing and replacing alumni forms */}
				<AlumniFormModal isOpen={deleteOpen} onClose={async () => setDeleteOpen(false)}>
					<DeleteAlumniButton open={editOpen} alumniMember={selectedAlumni} fetchData={getAlumni} closeModal={() => setEditOpen(false)}/>
				</AlumniFormModal>
				<AlumniFormModal isOpen={editOpen} onClose={async () => setEditOpen(false)}>
					<EditAlumniForm open={editOpen} alumniMember={selectedAlumni} getAlumni={getAlumni} closeModal={() => setEditOpen(false)} />
				</AlumniFormModal>
				<div className="max-w-screen-xl mx-auto px-4 text-center md:px-8">
					<div className="content-center">
						{/* Meet our team */}
						<div className="max-w-xl mx-auto">
							<h1
								className="bg-gradient-to-t from-primary to-secondary bg-clip-text text-4xl font-extrabold text-transparent md:text-5xl"
							>
								Meet our Alumni
							</h1>
							<p className="mt-3 text-xl leading-8 text-center">
								A dedicated page for alumni of the SSE
							</p>
							<div // Create Alumni Button
								className="gap-4 md:p-4">
								<CreateAlumniButton fetchData={getAlumni} />
							</div>
						</div>
					</div>
					

					{/* Alumni */}
					<div className="">
						<div className="w-full flex flex-row flex-wrap justify-center gap-5">
							{teamData.alumni_member.map((member, idx) => (
								<div key={idx}>
									{personCardBuilder.create(member)}
									{/* Edit and Remove buttons, only officers can see */}
									<ModifyAlumni alumniMember={member} openDeleteModal={() => setDeleteOpen(true)} openEditModal={() => setEditOpen(true)} setSelectedAlumni={setSelectedAlumni} />
								</div>
							))}
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
