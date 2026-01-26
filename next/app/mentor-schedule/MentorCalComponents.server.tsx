import { AddMentorButton, MentorButton } from "./MentorCalComponents.client"
import { dayLabels, hourLabels } from "./MentorCal.client"
import { ScheduleType } from "./MentorCal.types"

export const Header = ({
	title,
	children,
}: {
	title: string
	children: React.ReactNode
}) => (
	<section className="flex flex-col md:flex-row justify-between w-full gap-4">
		<h1 className="!text-left text-3xl md:text-5xl md:max-w-sm">{title}</h1>
		<p className="md:max-w-lg leading-7">{children}</p>
	</section>
)

export async function MentorCalendar({
	mentorBlocks,
	isMentor,
	mentorList,
}: {
	mentorBlocks: ScheduleType[]
	isMentor: boolean
	mentorList: { id: number; name: string; email: string }[]
}) {
	return (
		<>
			<table className="rounded-lg">
				<thead className="border-b-2">
					<tr className="bg-gray-300">
						<td className="w-28"></td>
						{dayLabels.map((day) => (
							<th key={day} className="text-center">
								{day}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y-2 divide-gray-300">
					{hourLabels.map(({ label, hour }) => (
						<tr
							key={hour}
							className="divide-x-2 divide-gray-300 !bg-transparent"
						>
							<th className="text-center">{label}</th>
							{Array.from({ length: 5 }).map((_, dayIndex) => (
								<td key={dayIndex.toFixed(2)} className="p-0 m-0 h-14">
									<div className="flex h-full group">
										<TimeBlock hour={hour} day={dayIndex + 1} />
									</div>
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</>
	)

	/**
	 * Rendered in each block of the calendar
	 * @param day The day of the week as an integer where 1 is Monday and 5 is Friday
	 * @param hour Hour in 24h time
	 */
	async function TimeBlock({ day, hour }: { day: number; hour: number }) {
		const matchesTime = mentorBlocks.filter(
			(block) => block.startHour === hour && block.weekday === day
		)

		if (matchesTime.length) {
			return matchesTime.map((data, index) => (
				<div className="contents" key={data.id}>
					<MentorButton data={data} index={index} />
					{matchesTime.length === 1 && isMentor && (
						<div className="overflow-hidden block group-hover:w-40 group-focus:w-40 w-0 h-full transition-[width_padding-right] group-hover:pr-2 duration-300">
							<AddMentorButton day={day} hour={hour} mentorList={mentorList} />
						</div>
					)}
				</div>
			))
		} else return isMentor && <AddMentorButton day={day} hour={hour} mentorList={mentorList} />
	}
}

export async function MentorDataList({ data }: { data: { id: number, name: string, email: string }[] }){

	return (
		<datalist id="mentorList">
			{data.map(({ id, name, email }) => (
				<option key={id} value={`${name} (${email})`} />
			))}
		</datalist>
	)
}
