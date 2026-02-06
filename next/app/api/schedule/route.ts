import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

// GET mentor schedule
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    const rawSchedule = await prisma.schedule.findFirst({
	where: id ? { id: parseInt(id) } : undefined,
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
				    description: true,
				},
			    },
			    mentorSkill: {
				select: {
				    skill: {
					select: {
					    id: true,
					    skill: true,
					},
				    },
				},
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
						    shortTitle: true,
						},
					    },
					},
				    },
				},
			    },
			},
		    },
		},
	    },
	},
    })

    if (!rawSchedule) {
	return NextResponse.json([])
    }

    const schedule = rawSchedule.blocks.map((block) => ({
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
		name: skill.skill,
	    })),
	    takenCourses: block.mentor.courseTaken.map(({ course }) => ({
		id: course.id,
		name: course.title,
		code: `${course.department.shortTitle}-${course.code}`,
		department: course.department.title,
	    })),
	},
    }))

    return NextResponse.json(schedule)  
}
