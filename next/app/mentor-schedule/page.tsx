import { getMentorSchedule, isMentor } from "./MentorCal.server"
import { MentorCalendar, Header } from "./MentorCalComponents.server"

export default async function Page() {
	const mentorStatus = await isMentor()
	const mentorBlocks = await getMentorSchedule()

	return (
		<main className="w-full max-w-7xl px-8 md:px-0 py-6 space-y-10">
			<Header title="Student Mentor Schedule">
				Need help with homework, assignments, or upcoming tests? Come into the
				<strong> SSE</strong> and get help from our student mentors!
			</Header>
			<MentorCalendar isMentor={mentorStatus} mentorBlocks={mentorBlocks} />
		</main>
	)
}
