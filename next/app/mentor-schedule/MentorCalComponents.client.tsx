"use client"

import { useRef } from "react"
import type { ScheduleType } from "./MentorCal.types"
import { format24hHour, mentorColors } from "./MentorCal.client"

// Client Components

export function AddMentorButton({ 
	day, 
	hour, 
	mentorList,
    }: { 
	day: number, 
	hour: number, 
	mentorList: { 
			id: number
			name: string
			email: string
		    }[]
    }){
	let modalRef = useRef<HTMLDialogElement>(null)
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
				onClick={() => modalRef.current?.showModal()}
				className="flex gap-2 items-center justify-center w-full h-full opacity-10 hover:opacity-100 focus-visible:opacity-100 transition focus-visible:outline outline-primary"
			>
				<AddIcon />
				Add
			</button>
			<dialog className="modal" ref={modalRef}>
				<article className="modal-box">
					<h2 className="leading-snug">Assign Mentor</h2>
					<p className="pb-2">
						{daysOfTheWeek[day]} from {format24hHour(hour)} to{" "}
						{format24hHour(hour + 1)}
					</p>
					<select className="select select-bordered w-full">
					    <option value="">-- Choose a mentor --</option>
					    {mentorList.map((mentor) => (
						<option key={mentor.id} value={mentor.id}>
						    {mentor.name}
						</option>
					    ))}
					</select>
				</article>
				<form method="dialog" className="modal-backdrop">
					<button>close</button>
				</form>
			</dialog>
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
	let ref = useRef<HTMLDialogElement>(null)
	return (
		<>
			<button
				style={
					{
						"--custom-color":
							mentorColors[mentor.id - (1 % mentorColors.length)],
					} as React.CSSProperties
				}
				onClick={() => ref.current?.showModal()}
				className={`py-4 my-2 ${
					!index ? "mx-2" : "mr-2"
				} flex hover:scale-[0.98] active:scale-95 transition rounded-xl items-center justify-center w-full bg-custom !text-black`}
			>
				{mentor.name.split(" ")?.[0] || "Mentor"}
			</button>
			<dialog ref={ref} className="modal">
				<article className="modal-box">
					<header className="flex gap-4">
						<img
							src={mentor.image}
							alt={`Picture of ${mentor.name}`}
							className="w-24 h-24 object-contain rounded-lg text-[0px] shrink-0 border-2 border-accent-content"
							loading="lazy"
						/>
						<section>
							<h2 className="leading-snug">{mentor.name}</h2>
							<p className="leading-none pr-4 whitespace-pre-wrap text-base pt-1">
								{mentor.description || "Mentor @ SSE"}
							</p>
						</section>
						<details className="dropdown dropdown-end ml-auto">
							<summary className="btn btn-square btn-ghost m-1">
								<Hamburger />
							</summary>
							<ul className="menu dropdown-content bg-base-200 rounded-box z-1 w-52 p-2 shadow-sm">
								<li>Edit</li>
								<li>Deallocate</li>
							</ul>
						</details>
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
				</article>
				<form method="dialog" className="modal-backdrop">
					<button>close</button>
				</form>
			</dialog>
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

const Hamburger: React.FC = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			className="h-6 w-6"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<title>Menu</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				d="M4 6h16M4 12h16m-7 6h7"
			/>
		</svg>
	)
}
