'use client, i guess'

export default function Page(){

	const daysOfTheWeek = ['MON', 'TUE', 'WED', 'THUR', 'FRI']
	const timesOfTheDay = {
		'10AM-11AM': [10, 11],
		'11AM-12PM': [11, 12],
		'12PM-1PM': [12, 13],
		'1PM-2PM': [13, 14],
		'2PM-3PM': [14, 15],
		'3PM-4PM': [15, 16],
		'4PM-5PM': [16, 17],
		'5PM-6PM': [17, 18]
	}

	const timeSlots = [
		{
			id: 1,
			mentor: 'John',
			timestamp: new Date(1757438400000),
		},
		{
			id: 2,
			mentor: 'Jane',
			timestamp: new Date(1757438400000),
		},
		{
			id: 3,
			mentor: 'Mark',
			timestamp: new Date(1757520000000)
		}
	]

	return (
		<main className="w-full max-w-7xl px-8 md:px-0 py-6 space-y-10 overflow-x-auto">
			<section className="flex flex-col md:flex-row justify-between w-full gap-4">
				<h1 className="!text-left">Student Mentor Schedule</h1>
				<p className="md:max-w-lg leading-7">Need help with homework, assignments, or upcoming tests? Come into the <strong>SSE</strong> and get help from our student mentors!</p>
			</section>
			<table className="rounded-lg !min-w-7xl shrink-0 overflow-x-auto">
				<thead className="border-b-2">
					<tr className="bg-gray-300">
						<td className="w-28"></td>
						{daysOfTheWeek.map(day => (
							<th key={day} className="text-center">{day}</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y-2 divide-gray-300">
					{Object.keys(timesOfTheDay).map((time, timeIndex) => (
						<tr key={time} className="divide-x-2 divide-gray-300 !bg-transparent">
							<th className="text-center">{time}</th>
							{Array.from({ length: 5 }).map((_,dayIndex) => (
								<td key={dayIndex.toFixed(2)} className="p-0 m-0 h-14">
									<div className="flex h-full">
										<TimeBlock time={timeIndex} day={dayIndex} />
									</div>
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</main>
	)

	/**
	 * Rendered in each block of the calendar
	 * @param day The day of the week as an integer where 1 is Monday and 5 is Friday
	 * @param time The associated time slot as an integer which indexes "timesOfTheDay"
	 */
	function TimeBlock({ day, time }: { day: number, time: number }) {
	
		const matchesDay = timeSlots.filter(({ timestamp }) => (timestamp.getDay() - 1) === day)
		const matchesTime = matchesDay.filter(({ timestamp }) => {
			const timeRange = timesOfTheDay[Object.keys(timesOfTheDay)[time] as keyof typeof timesOfTheDay]
			const [startHour, endHour] = timeRange
			  const estHour = new Intl.DateTimeFormat('en-US', {
				hour: 'numeric',
				hour12: false,
				timeZone: 'America/New_York'
			}).format(timestamp)
	  
			const timestampHour = parseInt(estHour)
			return timestampHour >= startHour && timestampHour < endHour
		})
	
		if (matchesTime.length){
			return matchesTime.map(({ id, mentor }, i) => (
				<button key={id} className={`py-4 my-2 mr-2 ${!i && 'ml-2'} hover:scale-[0.98] active:scale-95 transition rounded-xl flex items-center justify-center w-full bg-green-400`}>{mentor}</button>
			))
		} else return (
			<button className="flex gap-2 items-center justify-center w-full opacity-10 hover:opacity-100 focus-visible:opacity-100 transition focus-visible::outline outline-primary">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" className="w-5 h-5 stroke-current">
					  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
				Add Mentor
			</button>
		)
	}
}

