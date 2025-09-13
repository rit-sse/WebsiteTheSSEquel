export type ScheduleType = {
	id: number
	weekday: number
	startHour: number
	mentor: {
		id: number
		name: string
		description: string | null,
		image: string,
		connections: {
			gitHub: string | null,
			linkedIn: string | null
		}
		skills: {
			id: number
			name: string
		}[],
		takenCourses: {
			id: number
			code: string
			name: string
			department: string
		}[]
	}
}