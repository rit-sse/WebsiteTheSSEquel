'use server'

// Server Scripts

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import { prisma } from '@/lib/prisma'
import { ScheduleType } from "./MentorCal.types"

export async function isMentor() {
	const session = await getServerSession(authOptions)
	if (!session || !session.user?.email) return false

	return !!await prisma.mentor.count({
		where: {
			isActive: true,
			user: {
				email: session.user?.email,
			}
		}
	})
}

export async function getMentorNames(){
	if (!await isMentor()) return []
	const mentors = await prisma.mentor.findMany({
		where: {
			isActive: true,
		},
		select: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				}
			}
		}
	})

	return mentors.map(({ user }) => user)
}

export async function getMentorSchedule(id?: number): Promise<ScheduleType[]> {
	const rawSchedule = await prisma.schedule.findFirst({
		where: id ? { id } : undefined,
		select: {
			id: true,
			blocks: {
				select: {
					id: true,
					startHour: true,
					weekday: true,
					mentor: {
						select: {
							id: true,
							user: {
								select: {
									name: true,
									image: true,
									linkedIn: true,
									gitHub: true,
									description: true
								}
							},
							mentorSkill: {
								select: {
									skill: {
										select: {
											id: true,
											skill: true,
										}
									}
								}
							},
							courseTaken: {
								select: {
									course: {
										select: {
											id: true,
											title: true,
											code: true,
											department: {
												select: {
													id: true,
													title: true,
													shortTitle: true
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	})

	if (!rawSchedule) return []
	return rawSchedule.blocks.map(block => ({
		id: block.id,
		
		weekday: block.weekday,
		startHour: block.startHour,
		
		mentor: {
			id: block.mentor.id,
			name: block.mentor.user.name,
			description: block.mentor.user.description,
			image: block.mentor.user.image,
			connections: {
				gitHub: block.mentor.user.gitHub,
				linkedIn: block.mentor.user.linkedIn,
			},
			skills: block.mentor.mentorSkill.map(({ skill }) => ({
				id: skill.id,
				name: skill.skill
			})),
			takenCourses: block.mentor.courseTaken.map(({ course }) => ({
				id: course.id,
				name: course.title,
				code: `${course.department.shortTitle}-${course.code}`,
				department: course.department.title
			}))
		}
	}))
}
