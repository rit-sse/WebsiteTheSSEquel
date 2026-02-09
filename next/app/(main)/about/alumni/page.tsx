"use client"

import { useEffect, useState } from "react";
import AlumniCard from "./AlumniCard";
import { Modal } from "@/components/ui/modal";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Team, AlumniMember } from "./alumni";
import ModifyAlumni from "./ModifyAlumni";
import EditAlumniForm from "./EditAlumniForm";
import CreateAlumniButton from "./MakeNewAlumni";
import DeleteAlumniButton from "./DeleteAlumni";
import RequestAlumniForm from "./RequestAlumniForm";

function AlumniCardSkeleton() {
	return (
		<Card depth={2} className="w-full max-w-[280px] p-5 flex flex-col items-center">
			<Skeleton className="h-24 w-24 rounded-full mb-3" />
			<Skeleton className="h-5 w-32 mb-1" />
			<Skeleton className="h-4 w-24 mb-2" />
			<Skeleton className="h-12 w-full mb-3" />
		</Card>
	);
}

export default function Alumni() {
	// States to manage opening/closing of modals
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	// State of the current selected alumni (being edited / replaced)
	const [selectedAlumni, setSelectedAlumni] = useState<AlumniMember>();
	// State list of all active alumni
	const [teamData, setTeamData] = useState<Team>({ alumni_member: []});
	const [isLoading, setIsLoading] = useState(true);

	// Get all active alumni when page opens
	useEffect(() => {
		getAlumni();
	}, []);

	const getAlumni = async () => {
		setIsLoading(true);
		const team: Team = { alumni_member: []};
		try {
			const response = await fetch('/api/alumni/active');
			if (!response.ok) {
				throw new Error('Failed to fetch alumni');
			}
			const data = await response.json();

			// Map alumni to AlumniMember
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
		setIsLoading(false);
	};

	return (
		<section className="py-8 px-4 md:px-8">
			{/* Modals for editing and deleting alumni */}
			<Modal open={deleteOpen} onOpenChange={setDeleteOpen} title="Remove Alumni">
				<DeleteAlumniButton open={deleteOpen} alumniMember={selectedAlumni} fetchData={getAlumni} closeModal={() => setDeleteOpen(false)}/>
			</Modal>
			<Modal open={editOpen} onOpenChange={setEditOpen} title="Edit Alumni">
				<EditAlumniForm open={editOpen} alumniMember={selectedAlumni} getAlumni={getAlumni} closeModal={() => setEditOpen(false)} />
			</Modal>
			
			<div className="max-w-screen-xl mx-auto">
				<Card depth={1} className="p-6 md:p-8">
					{/* Header */}
					<div className="text-center mb-8">
						<h1 className="text-primary">
							Meet our Alumni
						</h1>
						<p className="mt-3 text-lg max-w-2xl mx-auto">
							A dedicated page for alumni of the SSE
						</p>
						{/* Action buttons */}
						<div className="mt-4 flex flex-wrap gap-3 justify-center">
							{/* Public request form - visible to everyone */}
							<RequestAlumniForm />
							{/* Direct add - officer only (handled inside component) */}
							<CreateAlumniButton fetchData={getAlumni} />
						</div>
					</div>
					
					{/* Alumni Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
						{isLoading ? (
							<>
								<AlumniCardSkeleton />
								<AlumniCardSkeleton />
								<AlumniCardSkeleton />
								<AlumniCardSkeleton />
							</>
						) : teamData.alumni_member.length === 0 ? (
							<p className="col-span-full text-muted-foreground text-center py-8">
								No alumni to display yet
							</p>
						) : (
							teamData.alumni_member.map((member, idx) => (
								<AlumniCard key={idx} alumniMember={member}>
									<ModifyAlumni 
										alumniMember={member} 
										openDeleteModal={() => setDeleteOpen(true)} 
										openEditModal={() => setEditOpen(true)} 
										setSelectedAlumni={setSelectedAlumni} 
									/>
								</AlumniCard>
							))
						)}
					</div>
				</Card>
			</div>
		</section>
	);
}
