import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { MENTOR_HEAD_TITLE } from "@/lib/utils"

export const dynamic = "force-dynamic"

/**
 * Check if the current user can manage mentor schedules
 * (Must be Mentoring Head or Primary Officer)
 */
async function canManageSchedules(userEmail: string): Promise<boolean> {
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
 * HTTP GET request to /api/scheduleBlock
 * Returns all schedule blocks for the active schedule, or a specific schedule if id provided
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const scheduleId = searchParams.get("scheduleId")

  try {
    // If scheduleId provided, get that schedule's blocks
    // Otherwise, get the active schedule's blocks
    const whereClause = scheduleId
      ? { id: parseInt(scheduleId) }
      : { isActive: true }

    const schedule = await prisma.mentorSchedule.findFirst({
      where: whereClause,
      select: {
        id: true,
        name: true,
        isActive: true,
        blocks: {
          select: {
            id: true,
            weekday: true,
            startHour: true,
            mentorId: true,
            mentor: {
              select: {
                id: true,
                isActive: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    description: true,
                    linkedIn: true,
                    gitHub: true,
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
          orderBy: [{ weekday: "asc" }, { startHour: "asc" }],
        },
      },
    })

    if (!schedule) {
      return NextResponse.json(
        { schedule: null, blocks: [] },
        { status: 200 }
      )
    }

    // Transform the data for easier consumption
    const blocks = schedule.blocks.map((block) => ({
      id: block.id,
      weekday: block.weekday,
      startHour: block.startHour,
      mentor: {
        id: block.mentor.id,
        isActive: block.mentor.isActive,
        name: block.mentor.user.name,
        email: block.mentor.user.email,
        image: block.mentor.user.image,
        description: block.mentor.user.description,
        linkedIn: block.mentor.user.linkedIn,
        gitHub: block.mentor.user.gitHub,
        skills: block.mentor.mentorSkill.map((ms) => ({
          id: ms.skill.id,
          name: ms.skill.skill,
        })),
        courses: block.mentor.courseTaken.map((ct) => ({
          id: ct.course.id,
          title: ct.course.title,
          code: `${ct.course.department.shortTitle}-${ct.course.code}`,
          department: ct.course.department.title,
        })),
      },
    }))

    return NextResponse.json({
      schedule: {
        id: schedule.id,
        name: schedule.name,
        isActive: schedule.isActive,
      },
      blocks,
    })
  } catch (error) {
    console.error("Error fetching schedule blocks:", error)
    return NextResponse.json(
      { error: "Failed to fetch schedule blocks" },
      { status: 500 }
    )
  }
}

/**
 * HTTP POST request to /api/scheduleBlock
 * Create a new schedule block (assign mentor to time slot)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const canManage = await canManageSchedules(session.user.email)
    if (!canManage) {
      return NextResponse.json(
        { error: "Only Mentoring Head or Primary Officers can manage schedules" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { mentorId, weekday, startHour, scheduleId } = body

    // Validate required fields
    if (mentorId === undefined || weekday === undefined || startHour === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: mentorId, weekday, startHour" },
        { status: 400 }
      )
    }

    // Validate weekday (1-5, Mon-Fri)
    if (weekday < 1 || weekday > 5) {
      return NextResponse.json(
        { error: "Invalid weekday. Must be between 1 (Monday) and 5 (Friday)" },
        { status: 400 }
      )
    }

    // Validate startHour (10-17, 10am-5pm)
    if (startHour < 10 || startHour > 17) {
      return NextResponse.json(
        { error: "Invalid start hour. Must be between 10 (10am) and 17 (5pm)" },
        { status: 400 }
      )
    }

    // Get the schedule to use (provided or active)
    let targetScheduleId = scheduleId
    if (!targetScheduleId) {
      const activeSchedule = await prisma.mentorSchedule.findFirst({
        where: { isActive: true },
        select: { id: true },
      })
      if (!activeSchedule) {
        return NextResponse.json(
          { error: "No active schedule found. Create a schedule first." },
          { status: 400 }
        )
      }
      targetScheduleId = activeSchedule.id
    }

    // Check if mentor exists and is active
    const mentor = await prisma.mentor.findUnique({
      where: { id: mentorId },
      select: { id: true, isActive: true },
    })

    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 })
    }

    // Check if this exact assignment already exists
    const existingBlock = await prisma.scheduleBlock.findFirst({
      where: {
        scheduleId: targetScheduleId,
        weekday,
        startHour,
        mentorId,
      },
    })

    if (existingBlock) {
      return NextResponse.json(
        { error: "This mentor is already assigned to this time slot" },
        { status: 409 }
      )
    }

    // Create the schedule block
    const scheduleBlock = await prisma.scheduleBlock.create({
      data: {
        mentorId,
        weekday,
        startHour,
        scheduleId: targetScheduleId,
      },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(scheduleBlock, { status: 201 })
  } catch (error) {
    console.error("Error creating schedule block:", error)
    return NextResponse.json(
      { error: "Failed to create schedule block" },
      { status: 500 }
    )
  }
}

/**
 * HTTP DELETE request to /api/scheduleBlock
 * Remove a schedule block (unassign mentor from time slot)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const canManage = await canManageSchedules(session.user.email)
    if (!canManage) {
      return NextResponse.json(
        { error: "Only Mentoring Head or Primary Officers can manage schedules" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, scheduleId } = body

    if (scheduleId) {
      const targetScheduleId = parseInt(scheduleId)
      if (Number.isNaN(targetScheduleId)) {
        return NextResponse.json(
          { error: "Invalid scheduleId" },
          { status: 400 }
        )
      }

      await prisma.scheduleBlock.deleteMany({
        where: { scheduleId: targetScheduleId },
      })

      return NextResponse.json({ success: true }, { status: 200 })
    }

    if (!id) {
      return NextResponse.json(
        { error: "Schedule block ID is required" },
        { status: 400 }
      )
    }

    // Check if block exists
    const block = await prisma.scheduleBlock.findUnique({
      where: { id },
    })

    if (!block) {
      return NextResponse.json(
        { error: "Schedule block not found" },
        { status: 404 }
      )
    }

    // Delete the block
    await prisma.scheduleBlock.delete({
      where: { id },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error deleting schedule block:", error)
    return NextResponse.json(
      { error: "Failed to delete schedule block" },
      { status: 500 }
    )
  }
}

/**
 * HTTP PUT request to /api/scheduleBlock
 * Move a schedule block to a new time slot
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const canManage = await canManageSchedules(session.user.email)
    if (!canManage) {
      return NextResponse.json(
        { error: "Only Mentoring Head or Primary Officers can manage schedules" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, weekday, startHour } = body

    if (!id) {
      return NextResponse.json(
        { error: "Schedule block ID is required" },
        { status: 400 }
      )
    }

    if (weekday === undefined || startHour === undefined) {
      return NextResponse.json(
        { error: "weekday and startHour are required" },
        { status: 400 }
      )
    }

    // Validate weekday (1-5, Mon-Fri)
    if (weekday < 1 || weekday > 5) {
      return NextResponse.json(
        { error: "Invalid weekday. Must be between 1 (Monday) and 5 (Friday)" },
        { status: 400 }
      )
    }

    // Validate startHour (10-17, 10am-5pm)
    if (startHour < 10 || startHour > 17) {
      return NextResponse.json(
        { error: "Invalid start hour. Must be between 10 (10am) and 17 (5pm)" },
        { status: 400 }
      )
    }

    const existingBlock = await prisma.scheduleBlock.findUnique({
      where: { id },
      select: { mentorId: true, scheduleId: true },
    })

    if (!existingBlock) {
      return NextResponse.json({ error: "Schedule block not found" }, { status: 404 })
    }

    // Check if this mentor is already at the target slot
    const conflict = await prisma.scheduleBlock.findFirst({
      where: {
        scheduleId: existingBlock.scheduleId,
        weekday,
        startHour,
        mentorId: existingBlock.mentorId,
      },
    })

    if (conflict && conflict.id !== id) {
      return NextResponse.json(
        { error: "This mentor is already assigned to the target slot" },
        { status: 409 }
      )
    }

    const updated = await prisma.scheduleBlock.update({
      where: { id },
      data: { weekday, startHour },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating schedule block:", error)
    return NextResponse.json(
      { error: "Failed to update schedule block" },
      { status: 500 }
    )
  }
}
