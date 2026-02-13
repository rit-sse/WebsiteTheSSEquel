import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { MENTOR_HEAD_TITLE } from "@/lib/utils"
import { resolveUserImage } from "@/lib/s3Utils"
import { recordMentorAvailabilityEvent } from "@/lib/mentorAvailabilityEvents"

export const dynamic = "force-dynamic"

interface AvailabilitySlot {
  weekday: number // 1-5 (Monday-Friday)
  hour: number    // 10-17 (10am-5pm)
}

/**
 * Check if the current user can manage all availability
 * (Must be Mentoring Head or Primary Officer)
 */
async function canManageAllAvailability(userEmail: string): Promise<boolean> {
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

/**
 * HTTP GET request to /api/mentor-availability
 * Get availability for a semester (optionally filtered by user)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const semesterId = searchParams.get("semesterId")
  const userId = searchParams.get("userId")
  const my = searchParams.get("my") === "true"

  try {
    const session = await getServerSession(authOptions)

    // If fetching own availability
    if (my) {
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const where: { userId: number; semesterId?: number } = { userId: user.id }
      if (semesterId) where.semesterId = parseInt(semesterId)

      const availability = await prisma.mentorAvailability.findMany({
        where,
        include: {
          semester: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      })

      return NextResponse.json(availability)
    }

    // For fetching all availability (requires management permission for full list)
    if (!semesterId) {
      return NextResponse.json(
        { error: "semesterId is required" },
        { status: 400 }
      )
    }

    // Anyone can view aggregated availability for scheduling purposes
    const availability = await prisma.mentorAvailability.findMany({
      where: { semesterId: parseInt(semesterId) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImageKey: true,
            googleImageURL: true,
          },
        },
      },
    })

    // Parse slots and return structured data
    const result = availability.map((a) => ({
      userId: a.userId,
      user: {
        ...a.user,
        image: resolveUserImage(a.user.profileImageKey, a.user.googleImageURL),
      },
      semesterId: a.semesterId,
      slots: JSON.parse(a.slots) as AvailabilitySlot[],
      updatedAt: a.updatedAt,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    )
  }
}

/**
 * HTTP POST request to /api/mentor-availability
 * Save availability for the current user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { semesterId, slots } = body

    if (!semesterId) {
      return NextResponse.json(
        { error: "semesterId is required" },
        { status: 400 }
      )
    }

    if (!Array.isArray(slots)) {
      return NextResponse.json(
        { error: "slots must be an array" },
        { status: 400 }
      )
    }

    // Validate slots format
    for (const slot of slots) {
      if (
        typeof slot.weekday !== "number" ||
        typeof slot.hour !== "number" ||
        slot.weekday < 1 ||
        slot.weekday > 5 ||
        slot.hour < 10 ||
        slot.hour > 17
      ) {
        return NextResponse.json(
          { error: "Invalid slot format. weekday must be 1-5, hour must be 10-17" },
          { status: 400 }
        )
      }
    }

    // Check if semester exists
    const semester = await prisma.mentorSemester.findUnique({
      where: { id: semesterId },
    })

    if (!semester) {
      return NextResponse.json({ error: "Semester not found" }, { status: 404 })
    }

    // Upsert availability
    const availability = await prisma.mentorAvailability.upsert({
      where: {
        userId_semesterId: {
          userId: user.id,
          semesterId,
        },
      },
      update: {
        slots: JSON.stringify(slots),
      },
      create: {
        userId: user.id,
        semesterId,
        slots: JSON.stringify(slots),
      },
      include: {
        semester: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    const mentor = await prisma.mentor.findFirst({
      where: { user_Id: user.id },
      select: { id: true },
    })

    const slotSet = new Set(
      slots.map((slot: AvailabilitySlot) => `${slot.weekday}-${slot.hour}`)
    )

    let removedBlocks: Array<{ weekday: number; startHour: number }> = []
    if (mentor && semester.scheduleId) {
      const existingBlocks = await prisma.scheduleBlock.findMany({
        where: {
          mentorId: mentor.id,
          scheduleId: semester.scheduleId,
        },
        select: {
          id: true,
          weekday: true,
          startHour: true,
        },
      })

      const blocksToRemove = existingBlocks.filter(
        (block) => !slotSet.has(`${block.weekday}-${block.startHour}`)
      )

      if (blocksToRemove.length > 0) {
        await prisma.scheduleBlock.deleteMany({
          where: {
            id: { in: blocksToRemove.map((block) => block.id) },
          },
        })
      }

      removedBlocks = blocksToRemove.map((block) => ({
        weekday: block.weekday,
        startHour: block.startHour,
      }))
    }

    recordMentorAvailabilityEvent({
      semesterId,
      userId: user.id,
      updatedAt: availability.updatedAt.toISOString(),
      removedBlocks,
    })

    return NextResponse.json({
      ...availability,
      slots: JSON.parse(availability.slots),
      removedBlocks,
    })
  } catch (error) {
    console.error("Error saving availability:", error)
    return NextResponse.json(
      { error: "Failed to save availability" },
      { status: 500 }
    )
  }
}

/**
 * HTTP DELETE request to /api/mentor-availability
 * Delete availability (user can delete their own, managers can delete any)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, semesterId } = body

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If deleting by ID
    if (id) {
      const existing = await prisma.mentorAvailability.findUnique({
        where: { id },
      })

      if (!existing) {
        return NextResponse.json({ error: "Availability not found" }, { status: 404 })
      }

      // Check permissions
      const canManage = await canManageAllAvailability(session.user.email)
      if (!canManage && existing.userId !== user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      await prisma.mentorAvailability.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    // If deleting by semesterId (own availability)
    if (semesterId) {
      await prisma.mentorAvailability.deleteMany({
        where: {
          userId: user.id,
          semesterId,
        },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: "id or semesterId is required" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error deleting availability:", error)
    return NextResponse.json(
      { error: "Failed to delete availability" },
      { status: 500 }
    )
  }
}
