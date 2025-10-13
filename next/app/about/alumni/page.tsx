"use client"

import { useEffect, useState } from "react";
import AlumniCard from "./AlumniCard";
import AlumniFormModal from "./AlumniFormModal";
import { Team, AlumniMember } from "./alumni";
import ModifyAlumni from "./ModifyAlumni";
import ReplaceAlumniForm from "./ReplaceAlumniForm";
import EditAlumniForm from "./EditAlumniForm";
import CreateAlumniButton from "./MakeNewAlumni";


export interface CreateAlumniProps {
  fetchData: () => Promise<void>;
}

export default function Leadership() {
	// States to manage opening/closing of modals
	const [replaceOpen, setReplaceOpen] = useState(false);
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
				.filter((alumni: any) => alumni)
				.map((alumni: any) => ({
					alumni_id: alumni.id,
					user_id: alumni.user.id,
					name: alumni.user.name,
					image: alumni.user.image,
					email: alumni.user.email,
					desc: alumni.user.description,
					linkedin: alumni.user.linkedIn,
					github: alumni.user.gitHub,
					quote: alumni.quote,
					previous_roles: alumni.previous_roles
				}));

		} catch (error) {
			console.error('Error:', error);
		}
		setTeamData(team);
	};

	return (
		<>
			<section className="mt-16">
				{/* Modals for editing and replacing alumni forms */}
				<AlumniFormModal isOpen={replaceOpen} onClose={async () => setReplaceOpen(false)}>
					<ReplaceAlumniForm open={replaceOpen} alumniMember={selectedAlumni} getAlumni={getAlumni} closeModel={() => setReplaceOpen(false)} />
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
								Meet the Alumni
							</h1>
							<p className="mt-3 text-xl leading-8 text-center">
								A dedicated page for alumni of the SSE
							</p>
						</div>
					</div>

					<div // Create Alumni Button
						className="
								grid
								grid-cols-1
								sm:grid-cols-1
								md:grid-cols-2
								lg:grid-cols-2
								gap-4
								md:p-4
							"
					>
						<CreateAlumniButton fetchData={getAlumni} />
					</div>

					{/* Alumni */}
					<div className="">
						<div className="w-full flex flex-row justify-center gap-5">
							{teamData.alumni_member.map((member, idx) => (
								<div key={idx}>
									<AlumniCard alumniMember={member} />
									{/* Edit and Remove buttons, only officers can see */}
									<ModifyAlumni alumniMember={member} openReplaceModal={() => setReplaceOpen(true)} openEditModal={() => setEditOpen(true)} setSelectedAlumni={setSelectedAlumni} />
								</div>
							))}
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
