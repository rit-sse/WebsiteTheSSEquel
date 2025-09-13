"use client"

import { useState } from "react"
import Modal from "@/components/Modal"
import type { ScheduleType } from "./MentorCal.types"
import { format24hHour, mentorColors } from "./MentorCal.client"

// Client Components

export function AddMentorButton({ day, hour }: { day: number; hour: number }) {
	const [isModalOpen, setIsModalOpen] = useState(false)

	const handleOpenModal = () => setIsModalOpen(true)
	const handleCloseModal = () => setIsModalOpen(false)
	const daysOfTheWeek = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	]

	return (
		<>
			<button
				onClick={handleOpenModal}
				className="flex gap-2 items-center justify-center w-full h-full opacity-10 hover:opacity-100 focus-visible:opacity-100 transition focus-visible:outline outline-primary"
			>
				<AddIcon />
				Add
			</button>
			<Modal isOpen={isModalOpen} onClose={handleCloseModal}>
				<article className="bg-white border-2 border-accent-content py-4 pb-1 px-6 rounded-lg justify-between items-start relative">
					<h2 className="leading-snug">Assign Mentor</h2>
					<p className="pb-2">
						{daysOfTheWeek[day]} from {format24hHour(hour)} to{" "}
						{format24hHour(hour + 1)}
					</p>
				</article>
				<button
					className="absolute right-8 top-4 text-gray-400 hover:text-gray-600 transition-colors"
					onClick={handleCloseModal}
				>
					<ExitIcon />
				</button>
			</Modal>
		</>
	)
}

export function MentorButton({
	data: { mentor },
	index,
}: {
	data: ScheduleType
	index: number
}) {
	const [isModalOpen, setIsModalOpen] = useState(false)

	const handleOpenModal = () => setIsModalOpen(true)
	const handleCloseModal = () => setIsModalOpen(false)

	return (
		<>
			<button
				style={{
					"--custom-color": mentorColors[mentor.id-1 % mentorColors.length]
				} as React.CSSProperties}
				onClick={handleOpenModal}
				className={`py-4 my-2 ${
					!index ? "mx-2" : "mr-2"
				} flex hover:scale-[0.98] active:scale-95 transition rounded-xl items-center justify-center w-full bg-custom !text-black`}
			>
				{mentor.name.split(" ")?.[0] || "Mentor"}
			</button>
			<Modal isOpen={isModalOpen} onClose={handleCloseModal}>
				<article className="bg-white border-2 border-accent-content pt-4 pb-1 px-6 rounded-lg justify-between items-start relative">
					<header className="flex gap-4">
						<img
							src={mentor.image}
							alt={`Picture of ${mentor.name}`}
							className="w-24 h-24 object-contain rounded-lg text-[0px] bg-white shrink-0 border-2 border-accent-content"
							loading="lazy"
						/>
						<section>
							<h2 className="leading-snug">{mentor.name}</h2>
							<p className="leading-none pr-4 whitespace-pre-wrap text-base pt-1">
								{mentor.description || "Mentor @ SSE"}
							</p>
						</section>
					</header>
					<main className="grid grid-cols-1 gap-4 w-full py-4 overflow-x-auto">
						{!!mentor.takenCourses.length && (
							<section>
								<h3 className="leading-none text-accent text-xl font-bold pb-2">
									Completed Courses
								</h3>
								<ul className="m-0 border-l-4 border-l-accent pb-3">
									{Object.entries(
										Object.groupBy(
											mentor.takenCourses,
											({ department }) => department
										)
									).map(([department, courses]) => (
										<li key={department} className="pl-6 list-none">
											<h4 key={department} className="text-base pt-1">
												{department}
											</h4>
											<ul>
												{courses
													?.toSorted((b, a) => (b.code > a.code ? 1 : -1))
													.map((course) => (
														<li key={course.id} className="leading-none">
															{course.name} ({course.code})
														</li>
													))}
											</ul>
										</li>
									))}
								</ul>
							</section>
						)}
						{!!mentor.skills.length && (
							<section>
								<h3 className="leading-none text-accent text-xl font-bold pb-2">
									Skills
								</h3>
								<ul className="border-l-4 border-l-accent m-0 py-1">
									{mentor.skills.map((skill) => (
										<li className="ml-10" key={skill.id}>
											{skill.name}
										</li>
									))}
								</ul>
							</section>
						)}
					</main>
					<button
						className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
						onClick={handleCloseModal}
					>
						<ExitIcon />
					</button>
				</article>
			</Modal>
		</>
	)
}

// Icons

export const AddIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth="1.5"
		className="w-5 h-5 stroke-current"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M12 4.5v15m7.5-7.5h-15"
		/>
	</svg>
)

export const ExitIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		strokeWidth="1.5"
		stroke="currentColor"
		className="w-10 h-10"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M6 18 18 6M6 6l12 12"
		/>
	</svg>
)
