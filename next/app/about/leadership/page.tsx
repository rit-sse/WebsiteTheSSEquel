"use client"

import { useEffect, useState } from "react";
import OfficerCard from "./OfficerCard";
import OfficerFormModal from "./OfficerFormModal";
import { Team, TeamMember } from "./team";
import ModifyOfficers from "./ModifyOfficers";
import ReplaceOfficerForm from "./ReplaceOfficerForm";
import EditOfficerForm from "./EditOfficerForm";
import { Skeleton } from "@/components/ui/skeleton";

import { Card } from "@/components/ui/card";

// Skeleton component for officer cards
function OfficerCardSkeleton() {
	return (
		<Card depth={2} className="w-full max-w-[280px] p-5 flex flex-col items-center">
			<Skeleton className="h-24 w-24 rounded-full mb-3" />
			<Skeleton className="h-5 w-32 mb-1" />
			<Skeleton className="h-4 w-24 mb-2" />
			<Skeleton className="h-12 w-full mb-3" />
			<div className="flex gap-3 pt-3 border-t border-border w-full justify-center">
				<Skeleton className="h-5 w-5" />
				<Skeleton className="h-5 w-5" />
				<Skeleton className="h-5 w-5" />
			</div>
		</Card>
	);
}

export default function Leadership() {
	// States to manage opening/closing of modals
	const [replaceOpen, setReplaceOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	// State of the current selected officer (being edited / replaced)
	const [selectedOfficer, setSelectedOfficer] = useState<TeamMember>();
	// State list of all active officers
	const [teamData, setTeamData] = useState<Team>({ primary_officers: [], committee_heads: [] });
	// Loading state
	const [isLoading, setIsLoading] = useState(true);

	// Get all active officers when page opens
	useEffect(() => {
		getOfficers();
	}, []);

	const getOfficers = async () => {
		setIsLoading(true);
		var team: Team = { primary_officers: [], committee_heads: [] };
		try {
			const response = await fetch('/api/officer/active');
			if (!response.ok) {
				throw new Error('Failed to fetch officers');
			}
			const data = await response.json();

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
		setIsLoading(false);
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
							<h1 className="text-primary">
								Meet our Team
							</h1>
							<p className="mt-3 text-xl leading-8">
								Have questions? Feel free to reach out to any of our officers!
							</p>
						</div>
					</div>

					{/* Primary Officers */}
					<h2 className="text-center text-primary my-8">
						Primary Officers
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center">
						{isLoading ? (
							<>
								<OfficerCardSkeleton />
								<OfficerCardSkeleton />
								<OfficerCardSkeleton />
								<OfficerCardSkeleton />
							</>
						) : (
							teamData.primary_officers.map((member, idx) => (
								<OfficerCard key={idx} teamMember={member}>
									<ModifyOfficers 
										teamMember={member} 
										openReplaceModal={() => setReplaceOpen(true)} 
										openEditModal={() => setEditOpen(true)} 
										setSelectedOfficer={setSelectedOfficer} 
									/>
								</OfficerCard>
							))
						)}
					</div>

					{/* Committee Heads */}
					<h2 className="text-center text-primary my-8 mt-12">
						Committee Heads
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
						{isLoading ? (
							<>
								<OfficerCardSkeleton />
								<OfficerCardSkeleton />
								<OfficerCardSkeleton />
								<OfficerCardSkeleton />
								<OfficerCardSkeleton />
								<OfficerCardSkeleton />
							</>
						) : (
							teamData.committee_heads.map((member, idx) => (
								<OfficerCard key={idx} teamMember={member}>
									<ModifyOfficers 
										teamMember={member} 
										openReplaceModal={() => setReplaceOpen(true)} 
										openEditModal={() => setEditOpen(true)} 
										setSelectedOfficer={setSelectedOfficer} 
									/>
								</OfficerCard>
							))
						)}
					</div>
				</div>
			</section>
		</>
	);
}
