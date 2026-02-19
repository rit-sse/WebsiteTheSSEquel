import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getGatewayAuthLevel } from "@/lib/authGateway"

export const dynamic = "force-dynamic"

/**
 * Check if the current user can manage mentor schedules
 * (Must be Mentoring Head or Primary Officer)
 */
async function canManageSchedules(request: NextRequest): Promise<boolean> {
  const authLevel = await getGatewayAuthLevel(request)
  return authLevel.isMentoringHead || authLevel.isPrimary
}

/**
 * HTTP GET request to /api/mentorSchedule
 * Returns all schedules or a specific schedule
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get("id")
  const activeOnly = searchParams.get("activeOnly") === "true"

  try {
    if (id) {
      const schedule = await prisma.mentorSchedule.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          name: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { blocks: true },
          },
        },
      })

      if (!schedule) {
        return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
      }

      return NextResponse.json(schedule)
    }

    const schedules = await prisma.mentorSchedule.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { blocks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error("Error fetching schedules:", error)
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    )
  }
}

/**
 * HTTP POST request to /api/mentorSchedule
 * Create a new schedule
 */
export async function POST(request: NextRequest) {
  try {
    const canManage = await canManageSchedules(request)
    if (!canManage) {
      return NextResponse.json(
        { error: "Only Mentoring Head or Primary Officers can manage schedules" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, setActive = false } = body

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Schedule name is required" },
        { status: 400 }
      )
    }

    // If setting this as active, deactivate all other schedules
    if (setActive) {
      await prisma.mentorSchedule.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })
    }

    const existingSchedule = await prisma.mentorSchedule.findFirst({
      where: { isActive: true },
      select: { id: true },
    })

    if (existingSchedule) {
      return NextResponse.json(
        { error: "A canonical schedule already exists" },
        { status: 409 }
      )
    }

    const schedule = await prisma.mentorSchedule.create({
      data: {
        name: name.trim(),
        isActive: true,
      },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error("Error creating schedule:", error)
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    )
  }
}

/**
 * HTTP PUT request to /api/mentorSchedule
 * Update a schedule (name, active status)
 */
export async function PUT(request: NextRequest) {
  try {
    const canManage = await canManageSchedules(request)
    if (!canManage) {
      return NextResponse.json(
        { error: "Only Mentoring Head or Primary Officers can manage schedules" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, name, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      )
    }

    // Check if schedule exists
    const existingSchedule = await prisma.mentorSchedule.findUnique({
      where: { id },
    })

    if (!existingSchedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    // If setting this as active, deactivate all other schedules
    if (isActive === true) {
      await prisma.mentorSchedule.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false },
      })
    }

    const updateData: { name?: string; isActive?: boolean } = {}
    if (name !== undefined) updateData.name = name.trim()
    if (isActive !== undefined) updateData.isActive = isActive

    const schedule = await prisma.mentorSchedule.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error("Error updating schedule:", error)
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    )
  }
}

/**
 * HTTP DELETE request to /api/mentorSchedule
 * Delete a schedule (and all its blocks via cascade)
 */
export async function DELETE(request: NextRequest) {
  try {
    const canManage = await canManageSchedules(request)
    if (!canManage) {
      return NextResponse.json(
        { error: "Only Mentoring Head or Primary Officers can manage schedules" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      )
    }

    // Check if schedule exists
    const existingSchedule = await prisma.mentorSchedule.findUnique({
      where: { id },
    })

    if (!existingSchedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    // Delete schedule (blocks will be deleted via cascade)
    await prisma.mentorSchedule.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting schedule:", error)
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    )
  }
}
