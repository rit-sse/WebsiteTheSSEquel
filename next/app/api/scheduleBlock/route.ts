import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
    try {
	const session = await getServerSession(authOptions)
	if (!session || !session.user?.email) {
	    return NextResponse.json({ error: "Unauthorized User" }), { status: 401 }
	}

	const isMentor = await prisma.mentor.count({
	    where: {
		isActive: true,
		user: {
		    email: session.user.email,
		}
	    }
	})

	if (!isMentor) {
	    return NextResponse.json({ error: "Only mentors can assign blocks"}, { status: 403 })
	}

	const { mentorId, weekday, startHour, scheduleId = 0 } = await request.json()

	if (!mentorId || weekday === undefined || startHour === undefined) {
	    return NextResponse.json(
		{ error: "Missing required fields: mentorId, weekday, startHour" },
		{ status: 400 }
	    )
	}

	if (weekday < 1 || weekday > 5) {
	    return NextResponse.json(
		{ error: "Invalid day. Must be between 1 and 5"},
		{ status: 400 }
	    )
	}

	if (startHour < 10 || startHour > 17) {
	    return NextResponse.json(
		{ error: "Invalid start hour. Must be between 10 and 17"},
		{ status: 400 }
	    )
	}


	const existingBlock = await prisma.scheduleBlock.findFirst({
	    where: {
		mentorId,
		weekday,
		startHour,
		scheduleId,
	    }
	})

	if (existingBlock) {
	    return NextResponse.json(
		{ error: "This block is already scheduled" },
		{ status: 409 }
	    )
	}

	const scheduleBlock = await prisma.scheduleBlock.create({
	    data: {
		mentorId,
		weekday,
		startHour,
		scheduleId,
	    },

	    include: {
		mentor: {
		    include: {
			user: {
			    select: {
				name: true,
				email: true,
			    }
			}
		    }
		}
	    }
	})

	return NextResponse.json(scheduleBlock, { status: 201 })
    } catch (error) {
	return NextResponse.json(
	    { error: "Failed to create schedule block" },
	    { status: 500 }
	)
    }
}
