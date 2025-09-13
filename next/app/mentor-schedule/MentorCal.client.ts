// Labels of the columns in the schedule (days)
export const dayLabels = ['mon', 'tue', 'wed', 'thurs', 'fri']

// Labels of the rows in the schedule (hour blocks)
export const hourLabels = getHourLabels(10, 18)

// possible mentor colors (from tailwind)
export const mentorColors = [
	'oklch(70.5% 0.213 47.604)', // orange-500
	'oklch(66.7% 0.295 322.15)', // fuchsia-500
	'oklch(68.5% 0.169 237.323)',// sky-500
	'oklch(63.7% 0.237 25.331)', // red-500
	'oklch(60.6% 0.25 292.717)', // violet-500
	'oklch(69.6% 0.17 162.48)',  // emerald-500
	'oklch(58.5% 0.233 277.117)',// indigo-500
	'oklch(72.3% 0.219 149.579)',// green-500
	'oklch(71.5% 0.143 215.221)',// cyan-500
]



// Helper functions
export function format24hHour(hour: number) {
	return `${hour % 12 || '12'}${hour >= 12 ? 'PM' : 'AM'}`
}

export function getHourLabels(startHour: number, endHour: number): { label: string, hour: number }[] {
	return Array.from({ length: endHour - startHour }).map((_, h) => {
		const hour = startHour + h

		return { label: `${format24hHour(hour)}-${format24hHour(hour + 1)}`, hour }
	})
}
