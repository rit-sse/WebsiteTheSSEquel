import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getMentorAvailabilityEvent } from "@/lib/mentorAvailabilityEvents"
import { getGatewayAuthLevel } from "@/lib/authGateway"

export const dynamic = "force-dynamic"

async function isMentoringManager(request: Request): Promise<boolean> {
  const authLevel = await getGatewayAuthLevel(request)
  return authLevel.isMentoringHead || authLevel.isPrimary
}

export async function GET(request: Request) {
  try {
    const canManage = await isMentoringManager(request)
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
