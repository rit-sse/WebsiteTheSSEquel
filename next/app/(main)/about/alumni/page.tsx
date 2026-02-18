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
import EmailComposerModal, { EmailComposerSendPayload } from "@/app/(main)/components/EmailComposerModal";
import { Mail, Users, AlertCircle } from "lucide-react";

function useAuthLevel() {
	const [authLevel, setAuthLevel] = useState<{ isPrimary: boolean }>({ isPrimary: false });
	useEffect(() => {
		fetch("/api/authLevel")
			.then((r) => r.json())
			.then((data) => setAuthLevel({ isPrimary: data.isPrimary ?? false }))
			.catch(() => {});
	}, []);
	return authLevel;
}

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
	const [emailOpen, setEmailOpen] = useState(false);
	const [optedInCount, setOptedInCount] = useState<number | null>(null);
	// State of the current selected alumni (being edited / replaced / viewed)
	const [selectedAlumni, setSelectedAlumni] = useState<AlumniMember>();
	const [expandedIds, setExpandedIds] = useState<string[]>([]);
	// State list of all active alumni
	const [teamData, setTeamData] = useState<Team>({ alumni_member: []});
	const [isLoading, setIsLoading] = useState(true);
	const [fetchError, setFetchError] = useState<string | null>(null);
	const { isPrimary } = useAuthLevel();

	// Get all active alumni when page opens
	useEffect(() => {
		getAlumni();
	}, []);

	const getAlumni = async () => {
		setIsLoading(true);
		setFetchError(null);
		const team: Team = { alumni_member: []};
		try {
			const response = await fetch('/api/alumni/active');
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error || 'Failed to fetch alumni');
			}
			if (!Array.isArray(data)) {
				throw new Error('Invalid response from server');
			}

			// Map alumni to AlumniMember
			team.alumni_member = data.map((alumni: any) => ({
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
				end_date: alumni.end_date,
				showEmail: alumni.showEmail ?? false,
				receiveEmails: alumni.receiveEmails ?? false,
			}));
		} catch (error) {
			console.error('Error:', error);
			setFetchError(error instanceof Error ? error.message : 'Failed to load alumni');
		}
		setTeamData(team);
		setIsLoading(false);
	};

	const toggleExpanded = (id: string) => {
		setExpandedIds((prev) =>
			prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
		);
	};

	useEffect(() => {
		if (emailOpen && optedInCount === null) {
			fetch("/api/alumni/email")
				.then((r) => (r.ok ? r.json() : null))
				.then((data) => { if (data) setOptedInCount(data.optedInCount); })
				.catch(() => {});
		}
	}, [emailOpen, optedInCount]);

	const handleAlumniSend = async (payload: EmailComposerSendPayload) => {
		const res = await fetch("/api/alumni/email", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				subject: payload.subject,
				message: payload.message,
				...(payload.attachments.length > 0 ? { attachments: payload.attachments } : {}),
			}),
		});
		if (!res.ok) {
			const text = await res.text();
			throw new Error(text || "Failed to send emails");
		}
		return res.json();
	};

	const alumniRecipientSummary = (
		<div className="space-y-2">
			<div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
				<Users className="h-4 w-4 shrink-0" />
				{optedInCount !== null ? (
					<span>
						Sent from <strong className="text-foreground">no-reply@sse.rit.edu</strong> to{" "}
						<strong className="text-foreground">{optedInCount}</strong> alumni who opted in.
					</span>
				) : (
					<span>Loading recipient count...</span>
				)}
			</div>
			{optedInCount === 0 && (
				<div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-800/30">
					<AlertCircle className="h-4 w-4 shrink-0" />
					<span>No alumni have opted in to receive emails yet. Emails won&apos;t be sent.</span>
				</div>
			)}
		</div>
	);

	return (
		<section className="w-full mt-16 pb-16">
			{/* Modals for editing and deleting alumni */}
			<Modal open={deleteOpen} onOpenChange={setDeleteOpen} title="Remove Alumni">
				<DeleteAlumniButton open={deleteOpen} alumniMember={selectedAlumni} fetchData={getAlumni} closeModal={() => setDeleteOpen(false)}/>
			</Modal>
			<Modal open={editOpen} onOpenChange={setEditOpen} title="Edit Alumni">
				<EditAlumniForm open={editOpen} alumniMember={selectedAlumni} getAlumni={getAlumni} closeModal={() => setEditOpen(false)} />
			</Modal>
			
			<div className="w-full px-4 md:px-8\">
				<Card depth={1} className="w-full p-6 md:p-8 overflow-hidden">
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
						{/* Mass email - primary officers only */}
						{isPrimary && (
							<button
								onClick={() => setEmailOpen(true)}
								className="inline-flex items-center gap-2 px-4 py-2 bg-background text-foreground border-2 border-border rounded-lg font-medium hover:bg-muted transition-colors"
							>
								<Mail size={18} />
								Email Alumni
							</button>
						)}
						<EmailComposerModal
							open={emailOpen}
							onClose={() => setEmailOpen(false)}
							title="Email Opted-In Alumni"
							onSend={handleAlumniSend}
							recipientSummary={alumniRecipientSummary}
						/>
						</div>
					</div>
					
					{/* Alumni Grid */}
					{isLoading ? (
						<div className="flex flex-wrap gap-4 justify-center w-full">
							<AlumniCardSkeleton />
							<AlumniCardSkeleton />
							<AlumniCardSkeleton />
							<AlumniCardSkeleton />
						</div>
					) : fetchError ? (
						<div className="text-center py-8 space-y-2">
							<p className="text-destructive font-medium">{fetchError}</p>
							<p className="text-sm text-muted-foreground">
								Check the server console. If the database is missing tables or columns, run: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npx prisma db push</code> and <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npx prisma db seed</code> from the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">next</code> folder.
							</p>
						</div>
					) : teamData.alumni_member.length === 0 ? (
						<p className="text-muted-foreground text-center py-8">
							No alumni to display yet. Officers can add alumni with the button above, or run <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npx prisma db seed</code> from the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">next</code> folder to seed sample data.
						</p>
					) : (
					<div className="flex flex-wrap gap-4 justify-center w-full">
						{teamData.alumni_member.map((member, idx) => {
							const id = String(member.alumni_id);
							const isExpanded = expandedIds.includes(id);
							return (
								<AlumniCard
									key={id || idx}
									alumniMember={member}
									onClick={() => toggleExpanded(id)}
									isExpanded={isExpanded}
									onClose={() =>
										setExpandedIds((prev) =>
											prev.filter((item) => item !== id)
										)
									}
								>
									<ModifyAlumni 
										alumniMember={member} 
										openDeleteModal={() => setDeleteOpen(true)} 
										openEditModal={() => setEditOpen(true)} 
										setSelectedAlumni={setSelectedAlumni} 
									/>
								</AlumniCard>
							);
						})}
					</div>
					)}
				</Card>
			</div>
		</section>
	);
}
