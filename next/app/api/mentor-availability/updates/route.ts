import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { MENTOR_HEAD_TITLE } from "@/lib/utils"
import { getMentorAvailabilityEvent } from "@/lib/mentorAvailabilityEvents"

export const dynamic = "force-dynamic"

async function isMentoringManager(userEmail: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { email: userEmail },
    select: {
      officers: {
        where: { is_active: true },
        select: {
          position: {
            select: {
              title: true,
              is_primary: true,
            },
          },
        },
      },
    },
  })

  if (!user) return false

  return user.officers.some(
    (officer) =>
      officer.position.title === MENTOR_HEAD_TITLE ||
      officer.position.is_primary
  )
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const canManage = await isMentoringManager(session.user.email)
    if (!canManage) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const activeSemester = await prisma.mentorSemester.findFirst({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
    })

    if (!activeSemester) {
      return NextResponse.json({
        semester: null,
        latestUpdatedAt: null,
        updatedMentorCount: 0,
        updates: [],
      })
    }

    const updates = await prisma.mentorAvailability.findMany({
      where: { semesterId: activeSemester.id },
      select: {
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({
      semester: activeSemester,
      latestUpdatedAt: updates[0]?.updatedAt ?? null,
      updatedMentorCount: updates.length,
      updates: updates.map((entry) => ({
        updatedAt: entry.updatedAt,
        user: entry.user,
        removedBlocks:
          getMentorAvailabilityEvent(activeSemester.id, entry.user.id)?.removedBlocks ?? [],
      })),
    })
  } catch (error) {
    console.error("Error getting mentor availability updates:", error)
    return NextResponse.json(
      { error: "Failed to load availability updates" },
      { status: 500 }
    )
  }
}
