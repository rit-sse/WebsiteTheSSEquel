"use client"

import { useEffect, useState } from "react";
import AlumniCard from "./AlumniCard";
import AlumniFormModal from "./AlumniFormModal";
import { Team, AlumniMember } from "./alumni";
import ModifyAlumni from "./ModifyAlumni";
import ReplaceAlumniForm from "./ReplaceAlumniForm";
import EditAlumniForm from "./EditAlumniForm";

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
			const response = await fetch('/api/officer/active'); // TO-DO: Check the /api/officer file and see how to make it for alumni
			if (!response.ok) {
				throw new Error('Failed to fetch alumni');
			}
			const data = await response.json();
			console.log(data.user)

			// Map primary alumni to AlimnuMember
			team.alumni_member = data
				.filter((alumni: any) => alumni.position.is_primary)
				.map((alumni: any) => ({
					alumni_id: alumni.id,
					user_id: alumni.user.id,
					name: alumni.user.name,
					image: alumni.user.image,
					title: alumni.position.title,
					email: alumni.user.email,
					desc: alumni.user.description,
					linkedin: alumni.user.linkedIn,
					github: alumni.user.gitHub
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
							<p className="mt-3 text-xl leading-8">
								A dedicated page for alumni of the SSE
							</p>
						</div>
					</div>

					{/* Alumni */}
					<div className="">
						<div className="w-full flex flex-row justify-center gap-5">
							{teamData.alumni_member.map((member, idx) => (
								<div key={idx}>
									<AlumniCard alumniMember={member} />
									{/* Edit and Remove buttons, only alumni can see */}
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
