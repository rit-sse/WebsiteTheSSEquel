"use client"

import { useEffect, useState } from "react";
import OfficerCard from "./OfficerCard";
import EmptyOfficerCard from "./EmptyOfficerCard";
import { Team, TeamMember, OfficerPosition, PositionWithOfficer, HistoricalYear, HistoricalOfficer } from "./team";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Timeline } from "@/components/ui/timeline";

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

function HistoricalOfficerGrid({ officers }: { officers: HistoricalOfficer[] }) {
	if (officers.length === 0) return null;
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
			{officers.map((officer) => (
				<OfficerCard
					key={officer.id}
					teamMember={{
						officer_id: String(officer.id),
						user_id: String(officer.user.id),
						name: officer.user.name,
						image: officer.user.image ?? "",
						title: officer.position.title,
						email: officer.user.email,
						desc: officer.user.description ?? undefined,
						linkedin: officer.user.linkedIn ?? undefined,
						github: officer.user.gitHub ?? undefined,
					}}
				/>
			))}
		</div>
	);
}

export default function Leadership() {
	const [teamData, setTeamData] = useState<Team>({ primary_officers: [], committee_heads: [] });
	const [historySemesters, setHistorySemesters] = useState<HistoricalYear[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isHistoryLoading, setIsHistoryLoading] = useState(true);
	const { isOfficer, isMentor } = useAuthLevel();
	const canSeeUnfilledPositions = isOfficer || isMentor;

	useEffect(() => {
		getOfficers();
		getHistory();
	}, []);

	const getOfficers = async () => {
		setIsLoading(true);
		const team: Team = { primary_officers: [], committee_heads: [] };
		try {
			const [positionsResponse, officersResponse] = await Promise.all([
				fetch('/api/officer-positions'),
				fetch('/api/officer/active')
			]);
			if (!positionsResponse.ok || !officersResponse.ok) throw new Error('Failed to fetch data');

			const positions: OfficerPosition[] = await positionsResponse.json();
			const officers = await officersResponse.json();

			const officerByPosition = new Map<string, TeamMember>();
			officers.forEach((officer: any) => {
				officerByPosition.set(officer.position.title, {
					officer_id: officer.id,
					user_id: officer.user.id,
					name: officer.user.name,
					image: officer.user.image,
					title: officer.position.title,
					email: officer.user.email,
					desc: officer.user.description,
					linkedin: officer.user.linkedIn,
					github: officer.user.gitHub
				});
			});

			positions.forEach((position) => {
				const positionWithOfficer: PositionWithOfficer = {
					position,
					officer: officerByPosition.get(position.title) || null
				};
				if (position.is_primary) team.primary_officers.push(positionWithOfficer);
				else team.committee_heads.push(positionWithOfficer);
			});
			team.committee_heads.sort((a, b) => a.position.title.localeCompare(b.position.title));
		} catch (error) {
			console.error('Error:', error);
		}
		setTeamData(team);
		setIsLoading(false);
	};

	const getHistory = async () => {
		setIsHistoryLoading(true);
		try {
			const response = await fetch("/api/officer/history");
			if (response.ok) {
				const data: HistoricalYear[] = await response.json();
				setHistorySemesters(data);
			}
		} catch (error) {
			console.error("Error fetching officer history:", error);
		}
		setIsHistoryLoading(false);
	};

	// Build timeline data — each semester is collapsible
	const timelineData = historySemesters.map((hs) => ({
		title: hs.year,
		collapsible: true,
		content: (
			<div className="space-y-8">
				{hs.primary_officers.length > 0 && (
					<div>
						<h4 className="text-base font-semibold text-primary mb-4">Primary Officers</h4>
						<HistoricalOfficerGrid officers={hs.primary_officers} />
					</div>
				)}
				{hs.committee_heads.length > 0 && (
					<div>
						<h4 className="text-base font-semibold text-primary mb-4">Committee Heads</h4>
						<HistoricalOfficerGrid officers={hs.committee_heads} />
					</div>
				)}
			</div>
		),
	}));

	return (
		<section className="mt-16 pb-16 w-full">
			<div className="w-full max-w-screen-xl mx-auto px-4 md:px-8">
				<Card depth={1} className="p-6 md:p-8 w-full">

					{/* ── Header ── */}
					<div className="text-center mb-10">
						<h1 className="text-primary">Meet our Team</h1>
						<p className="mt-3 text-xl leading-8">
							Have questions? Feel free to reach out to any of our officers!
						</p>
						<div className="mt-4">
							<ManageLink isOfficer={isOfficer} />
						</div>
					</div>

					{/* ── Current: Primary Officers ── */}
					<div className="mb-10">
						<h2 className="text-center text-primary mb-6">Primary Officers</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center">
							{isLoading ? (
								<><OfficerCardSkeleton /><OfficerCardSkeleton /><OfficerCardSkeleton /><OfficerCardSkeleton /></>
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

					{/* ── Current: Committee Heads ── */}
					<div className="mb-16">
						<h2 className="text-center text-primary mb-6">Committee Heads</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
							{isLoading ? (
								<><OfficerCardSkeleton /><OfficerCardSkeleton /><OfficerCardSkeleton /><OfficerCardSkeleton /><OfficerCardSkeleton /><OfficerCardSkeleton /></>
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

					{/* ── History: scroll-animated timeline ── */}
					{(isHistoryLoading || timelineData.length > 0) && (
						<>
							<div className="border-t border-border pt-10 mb-2">
								<h2 className="text-center text-primary mb-2">Past Officers</h2>
								<p className="text-center text-muted-foreground text-sm mb-0">
									Scroll through our leadership history
								</p>
							</div>

							{isHistoryLoading ? (
								<div className="flex flex-col gap-6 mt-8 pl-16">
									<Skeleton className="h-6 w-28" />
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
										<OfficerCardSkeleton /><OfficerCardSkeleton /><OfficerCardSkeleton /><OfficerCardSkeleton />
									</div>
								</div>
							) : (
								<Timeline data={timelineData} />
							)}
						</>
					)}
				</Card>
			</div>
		</section>
	);
}
