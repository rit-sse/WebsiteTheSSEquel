import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { MENTOR_HEAD_TITLE } from "@/lib/utils"
import { getCurrentSemester } from "@/lib/semester"
import { getAcademicTermDateRange, parseAcademicTermLabel } from "@/lib/academicTerm"

export const dynamic = "force-dynamic"

/**
 * Check if the current user can manage mentor semesters
 * (Must be Mentoring Head or Primary Officer)
 */
async function canManageSemesters(userEmail: string): Promise<boolean> {
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
 * HTTP GET request to /api/mentor-semester
 * Returns all semesters with application counts
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get("id")
  const activeOnly = searchParams.get("activeOnly") === "true"

  try {
    if (id) {
      const semester = await prisma.mentorSemester.findUnique({
        where: { id: parseInt(id) },
        include: {
          schedule: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
          _count: {
            select: { applications: true, availability: true },
          },
        },
      })

      if (!semester) {
        return NextResponse.json({ error: "Semester not found" }, { status: 404 })
      }

      return NextResponse.json(semester)
    }

    const semesters = await prisma.mentorSemester.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        schedule: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        _count: {
          select: { applications: true, availability: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(semesters)
  } catch (error) {
    console.error("Error fetching semesters:", error)
    return NextResponse.json(
      { error: "Failed to fetch semesters" },
      { status: 500 }
    )
  }
}

/**
 * HTTP POST request to /api/mentor-semester
 * Create a new semester (and optionally a linked schedule)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const canManage = await canManageSemesters(session.user.email)
    if (!canManage) {
      return NextResponse.json(
        { error: "Only Mentoring Head or Primary Officers can manage semesters" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      when2meetUrl,
      applicationOpen,
      applicationClose,
      semesterStart,
      semesterEnd,
      setActive = false,
    } = body

    const semesterName =
      typeof name === "string" && name.trim() !== ""
        ? name.trim()
        : getCurrentSemester().label
    const parsedTerm = parseAcademicTermLabel(semesterName)
    const derivedDateRange = parsedTerm
      ? getAcademicTermDateRange(parsedTerm.term, parsedTerm.year)
      : null

    // If setting this as active, deactivate all other semesters
    if (setActive) {
      await prisma.mentorSemester.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })
    }

    // Use the canonical schedule (create one if none exists)
    let scheduleId: number | null = null
    const existingSchedule = await prisma.mentorSchedule.findFirst({
      where: { isActive: true },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    })

    if (existingSchedule) {
      scheduleId = existingSchedule.id
    } else {
      const schedule = await prisma.mentorSchedule.create({
        data: {
          name: "Mentor Schedule",
          isActive: true,
        },
      })
      scheduleId = schedule.id
    }

    const semester = await prisma.mentorSemester.create({
      data: {
        name: semesterName,
        when2meetUrl: when2meetUrl || null,
        applicationOpen: applicationOpen ? new Date(applicationOpen) : null,
        applicationClose: applicationClose ? new Date(applicationClose) : null,
        semesterStart: semesterStart
          ? new Date(semesterStart)
          : derivedDateRange?.startDate ?? null,
        semesterEnd: semesterEnd
          ? new Date(semesterEnd)
          : derivedDateRange?.endDate ?? null,
        isActive: setActive,
        scheduleId,
      },
      include: {
        schedule: true,
        _count: {
          select: { applications: true },
        },
      },
    })

    return NextResponse.json(semester, { status: 201 })
  } catch (error) {
    console.error("Error creating semester:", error)
    return NextResponse.json(
      { error: "Failed to create semester" },
      { status: 500 }
    )
  }
}

/**
 * HTTP PUT request to /api/mentor-semester
 * Update a semester
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const canManage = await canManageSemesters(session.user.email)
    if (!canManage) {
      return NextResponse.json(
        { error: "Only Mentoring Head or Primary Officers can manage semesters" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      id,
      name,
      when2meetUrl,
      applicationOpen,
      applicationClose,
      semesterStart,
      semesterEnd,
      isActive,
    } = body

    if (!id) {
      return NextResponse.json(
        { error: "Semester ID is required" },
        { status: 400 }
      )
    }

    // Check if semester exists
    const existingSemester = await prisma.mentorSemester.findUnique({
      where: { id },
    })

    if (!existingSemester) {
      return NextResponse.json({ error: "Semester not found" }, { status: 404 })
    }

    // If setting this as active, deactivate all other semesters
    if (isActive === true) {
      await prisma.mentorSemester.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false },
      })
    }

    const updateData: {
      name?: string
      when2meetUrl?: string | null
      applicationOpen?: Date | null
      applicationClose?: Date | null
      semesterStart?: Date | null
      semesterEnd?: Date | null
      isActive?: boolean
    } = {}

    if (name !== undefined) {
      const trimmedName = typeof name === "string" ? name.trim() : ""
      if (!trimmedName) {
        return NextResponse.json(
          { error: "Semester name cannot be empty" },
          { status: 400 }
        )
      }
      updateData.name = trimmedName

      // Keep date boundaries aligned when the name is canonical and no explicit override is provided.
      if (semesterStart === undefined && semesterEnd === undefined) {
        const parsedTerm = parseAcademicTermLabel(trimmedName)
        if (parsedTerm) {
          const derivedDateRange = getAcademicTermDateRange(
            parsedTerm.term,
            parsedTerm.year
          )
          updateData.semesterStart = derivedDateRange.startDate
          updateData.semesterEnd = derivedDateRange.endDate
        }
      }
    }
    if (when2meetUrl !== undefined) updateData.when2meetUrl = when2meetUrl || null
    if (applicationOpen !== undefined) updateData.applicationOpen = applicationOpen ? new Date(applicationOpen) : null
    if (applicationClose !== undefined) updateData.applicationClose = applicationClose ? new Date(applicationClose) : null
    if (semesterStart !== undefined) updateData.semesterStart = semesterStart ? new Date(semesterStart) : null
    if (semesterEnd !== undefined) updateData.semesterEnd = semesterEnd ? new Date(semesterEnd) : null
    if (isActive !== undefined) updateData.isActive = isActive

    const semester = await prisma.mentorSemester.update({
      where: { id },
      data: updateData,
      include: {
        schedule: true,
        _count: {
          select: { applications: true },
        },
      },
    })

    return NextResponse.json(semester)
  } catch (error) {
    console.error("Error updating semester:", error)
    return NextResponse.json(
      { error: "Failed to update semester" },
      { status: 500 }
    )
  }
}

/**
 * HTTP DELETE request to /api/mentor-semester
 * Delete a semester
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const canManage = await canManageSemesters(session.user.email)
    if (!canManage) {
      return NextResponse.json(
        { error: "Only Mentoring Head or Primary Officers can manage semesters" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: "Semester ID is required" },
        { status: 400 }
      )
    }

    // Check if semester exists
    const existingSemester = await prisma.mentorSemester.findUnique({
      where: { id },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    })

    if (!existingSemester) {
      return NextResponse.json({ error: "Semester not found" }, { status: 404 })
    }

    // Warn if there are applications
    if (existingSemester._count.applications > 0) {
      // Applications will be cascade deleted
      console.log(`Deleting semester ${id} with ${existingSemester._count.applications} applications`)
    }

    // Delete semester (applications will be cascade deleted)
    await prisma.mentorSemester.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting semester:", error)
    return NextResponse.json(
      { error: "Failed to delete semester" },
      { status: 500 }
    )
  }
}
