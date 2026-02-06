import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

async function isMentor() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) return false

    return !!(await prisma.mentor.count({
	where: {
	    isActive: true,
	    user: {
		email: session.user?.email,
	    },
	},
    }))
}

// GET mentor names
export async function GET() {
    const mentorStatus = await isMentor() 

    if (!mentorStatus) {
	return NextResponse.json({ isMentor: false, mentors: [] })
    }

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
		},
	    },
	},
    })

    return NextResponse.json({
	isMentor: true,
	mentors: mentors.map(({ user }) => user),
    })
}
