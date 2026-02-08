"use client"

import { useEffect, useState } from "react";
import OfficerCard from "./OfficerCard";
import EmptyOfficerCard from "./EmptyOfficerCard";
import { Team, TeamMember, OfficerPosition, PositionWithOfficer } from "./team";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import Link from "next/link";

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

// Hook to check user auth level
function useAuthLevel() {
	const [authLevel, setAuthLevel] = useState<{
		isOfficer: boolean;
		isMentor: boolean;
	}>({ isOfficer: false, isMentor: false });

	useEffect(() => {
		(async () => {
			try {
				const response = await fetch("/api/authLevel");
				const data = await response.json();
				setAuthLevel({
					isOfficer: data.isOfficer ?? false,
					isMentor: data.isMentor ?? false
				});
			} catch {
				setAuthLevel({ isOfficer: false, isMentor: false });
			}
		})();
	}, []);

	return authLevel;
}

// Component to show manage link for officers
function ManageLink({ isOfficer }: { isOfficer: boolean }) {
	if (!isOfficer) return null;

	return (
		<Link href="/dashboard/positions">
			<Button variant="neutral" size="sm">
				<Settings className="h-4 w-4 mr-2" />
				Manage Officers
			</Button>
		</Link>
	);
}

export default function Leadership() {
	// State list of all positions with their officers
	const [teamData, setTeamData] = useState<Team>({ primary_officers: [], committee_heads: [] });
	// Loading state
	const [isLoading, setIsLoading] = useState(true);
	// Auth level to determine if unfilled positions should be shown
	const { isOfficer, isMentor } = useAuthLevel();
	// Only mentors and officers can see unfilled positions
	const canSeeUnfilledPositions = isOfficer || isMentor;

	// Get all positions and officers when page opens
	useEffect(() => {
		getOfficers();
	}, []);

	const getOfficers = async () => {
		setIsLoading(true);
		const team: Team = { primary_officers: [], committee_heads: [] };
		
		try {
			// Fetch all positions and active officers in parallel
			const [positionsResponse, officersResponse] = await Promise.all([
				fetch('/api/officer-positions'),
				fetch('/api/officer/active')
			]);

			if (!positionsResponse.ok || !officersResponse.ok) {
				throw new Error('Failed to fetch data');
			}

			const positions: OfficerPosition[] = await positionsResponse.json();
			const officers = await officersResponse.json();

			// Create a map of position title to active officer
			const officerByPosition = new Map<string, TeamMember>();
			officers.forEach((officer: any) => {
				const teamMember: TeamMember = {
					officer_id: officer.id,
					user_id: officer.user.id,
					name: officer.user.name,
					image: officer.user.image,
					title: officer.position.title,
					email: officer.user.email,
					desc: officer.user.description,
					linkedin: officer.user.linkedIn,
					github: officer.user.gitHub
				};
				officerByPosition.set(officer.position.title, teamMember);
			});

			// Map positions to PositionWithOfficer
			positions.forEach((position) => {
				const positionWithOfficer: PositionWithOfficer = {
					position,
					officer: officerByPosition.get(position.title) || null
				};

				if (position.is_primary) {
					team.primary_officers.push(positionWithOfficer);
				} else {
					team.committee_heads.push(positionWithOfficer);
				}
			});

			// Sort committee heads by title
			team.committee_heads.sort((a, b) => a.position.title.localeCompare(b.position.title));

		} catch (error) {
			console.error('Error:', error);
		}

		setTeamData(team);
		setIsLoading(false);
	};

	return (
		<section className="mt-16 pb-16">
			<div className="max-w-screen-xl mx-auto px-4 md:px-8">
				{/* Outer wrapper card */}
				<Card depth={1} className="p-6 md:p-8">
					{/* Header section */}
					<div className="text-center mb-8">
						<h1 className="text-primary">
							Meet our Team
						</h1>
						<p className="mt-3 text-xl leading-8">
							Have questions? Feel free to reach out to any of our officers!
						</p>
						<div className="mt-4">
							<ManageLink isOfficer={isOfficer} />
						</div>
					</div>

				{/* Primary Officers */}
				<div className="mb-10">
					<h2 className="text-center text-primary mb-6">
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
							teamData.primary_officers.map((item, idx) => (
								item.officer ? (
									<OfficerCard key={idx} teamMember={item.officer} />
								) : canSeeUnfilledPositions ? (
									<EmptyOfficerCard key={idx} position={item.position} />
								) : null
							))
						)}
					</div>
				</div>

				{/* Committee Heads */}
				<div>
					<h2 className="text-center text-primary mb-6">
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
							teamData.committee_heads.map((item, idx) => (
								item.officer ? (
									<OfficerCard key={idx} teamMember={item.officer} />
								) : canSeeUnfilledPositions ? (
									<EmptyOfficerCard key={idx} position={item.position} />
								) : null
							))
						)}
					</div>
				</div>
				</Card>
			</div>
		</section>
	);
}
