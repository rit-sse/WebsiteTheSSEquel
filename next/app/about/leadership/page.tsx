"use client"

import { useEffect, useState } from "react";
import OfficerCard from "./OfficerCard";
import OfficerFormModal from "./OfficerFormModal";
import { Team, TeamMember } from "./team";
import ModifyOfficers from "./ModifyOfficers";
import ReplaceOfficerForm from "./ReplaceOfficerForm";
import EditOfficerForm from "./EditOfficerForm";

export default function Leadership() {
	// States to manage opening/closing of modals
	const [replaceOpen, setReplaceOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	// State of the current selected officer (being edited / replaced)
	const [selectedOfficer, setSelectedOfficer] = useState<TeamMember>();
	// State list of all active officers
	const [teamData, setTeamData] = useState<Team>({ primary_officers: [], committee_heads: [] });

	// Get all active officers when page opens
	useEffect(() => {
		getOfficers();
	}, []);

	const getOfficers = async () => {
		var team: Team = { primary_officers: [], committee_heads: [] };
		try {
			const response = await fetch('/api/officer/active');
			if (!response.ok) {
				throw new Error('Failed to fetch officers');
			}
			const data = await response.json();
			console.log(data.user)

			// Map primary officers to TeamMember
			team.primary_officers = data
				.filter((officer: any) => officer.position.is_primary)
				.map((officer: any) => ({
					officer_id: officer.id,
					user_id: officer.user.id,
					name: officer.user.name,
					image: officer.user.image,
					title: officer.position.title,
					email: officer.user.email,
					desc: officer.user.description,
					linkedin: officer.user.linkedIn,
					github: officer.user.gitHub
				}));

			// Map committee officers to TeamMember
			team.committee_heads = data
				.filter((officer: any) => !officer.position.is_primary)
				.map((officer: any) => ({
					officer_id: officer.id,
					user_id: officer.user.id,
					name: officer.user.name,
					image: officer.user.image,
					title: officer.position.title,
					email: officer.user.email,
					desc: officer.user.description,
					linkedin: officer.user.linkedIn,
					github: officer.user.gitHub
				}));

		} catch (error) {
			console.error('Error:', error);
		}
		// Sort officers by title
		team.committee_heads.sort((a, b) => {
			if (a.title < b.title) {
				return -1;
			}
			return 1;
		});
		setTeamData(team);
	};

	return (
		<>
			<section className="mt-16">
				{/* Modals for editing and replacing officer forms */}
				<OfficerFormModal isOpen={replaceOpen} onClose={async () => setReplaceOpen(false)}>
					<ReplaceOfficerForm open={replaceOpen} teamMember={selectedOfficer} getOfficers={getOfficers} closeModel={() => setReplaceOpen(false)} />
				</OfficerFormModal>
				<OfficerFormModal isOpen={editOpen} onClose={async () => setEditOpen(false)}>
					<EditOfficerForm open={editOpen} teamMember={selectedOfficer} getOfficers={getOfficers} closeModal={() => setEditOpen(false)} />
				</OfficerFormModal>
				<div className="max-w-screen-xl mx-auto px-4 text-center md:px-8">
					<div className="content-center">
						{/* Meet our team */}
						<div className="max-w-xl mx-auto">
							<h1
								className="bg-gradient-to-t from-primary to-secondary 
              bg-clip-text text-4xl font-extrabold text-transparent md:text-5xl"
							>
								Meet our Team
							</h1>
							<p className="mt-3 text-xl leading-8">
								Have questions? Feel free to reach out to any of our officers!
							</p>
						</div>
					</div>

					{/* Primary Officers */}
					<h2 className="text-xl text-center font-extrabold text-primary-focus sm:text-3xl my-12">
						Primary Officers
					</h2>
					<div className="">
						<div className="w-full flex flex-row justify-center space-x-5">
							{teamData.primary_officers.map((member, idx) => (
								<div key={idx}>
									<OfficerCard teamMember={member} />
									{/* Edit and Remove buttons, only officers can see */}
									<ModifyOfficers teamMember={member} openReplaceModal={() => setReplaceOpen(true)} openEditModal={() => setEditOpen(true)} setSelectedOfficer={setSelectedOfficer} />
								</div>
							))}
						</div>
					</div>
					{/* Committee Heads */}
					<div className="mt-10">
						<h2 className="text-xl text-center font-extrabold text-primary-focus sm:text-3xl my-12">
							Committee Heads
						</h2>
						<div className="mt-5">
							<div className="w-full flex flex-row justify-center space-x-5">
								{teamData.committee_heads.map((member, idx) => (
									<div key={idx}>
										<OfficerCard teamMember={member} />
										{/* Edit and Remove buttons, only officers can see */}
										<ModifyOfficers teamMember={member} openReplaceModal={() => setReplaceOpen(true)} openEditModal={() => setEditOpen(true)} setSelectedOfficer={setSelectedOfficer} />
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
