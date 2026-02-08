import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import prisma from "@/lib/prisma"
import { MENTOR_HEAD_TITLE } from "@/lib/utils"

export const dynamic = "force-dynamic"

interface ImportRow {
  createdAt: string
  mentors: string[]
  peopleInLab?: number
  feeling?: string
  studentsMentoredCount?: number
  testsCheckedOutCount?: number
  classes?: string[]
  otherClassText?: string | null
}

async function canManageMentors(userEmail: string): Promise<boolean> {
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

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim()
}

function normalizeCourseCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const canManage = await canManageMentors(session.user.email)
    if (!canManage) {
      return NextResponse.json(
        { error: "Only Mentoring Head or Primary Officers can import headcount data" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { type, rows, semesterId } = body as {
      type?: "mentor" | "mentee"
      rows?: ImportRow[]
      semesterId?: number
    }

    if (!type || !rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      )
    }

    const targetSemesterId = semesterId ?? null
    const mentors = await prisma.mentor.findMany({
      where: { isActive: true },
      select: {
        id: true,
        user: { select: { name: true, email: true } },
      },
    })

    const mentorByEmail = new Map<string, number>()
    const mentorByName = new Map<string, number>()
    mentors.forEach((mentor) => {
      mentorByEmail.set(mentor.user.email.toLowerCase(), mentor.id)
      mentorByName.set(normalizeKey(mentor.user.name), mentor.id)
    })

    const courses = await prisma.course.findMany({
      select: {
        id: true,
        code: true,
        department: { select: { shortTitle: true } },
        title: true,
      },
    })

    const courseMap = new Map<string, number>()
    courses.forEach((course) => {
      const codeKey = normalizeCourseCode(`${course.department.shortTitle}${course.code}`)
      courseMap.set(codeKey, course.id)
      courseMap.set(normalizeCourseCode(course.title), course.id)
    })

    let created = 0
    let skipped = 0
    const errors: string[] = []

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const createdAt = new Date(row.createdAt)
      if (Number.isNaN(createdAt.getTime())) {
        skipped += 1
        errors.push(`Row ${index + 1}: invalid timestamp`)
        continue
      }

      const mentorIds = row.mentors
        .map((mentor) => {
          const emailKey = mentor.toLowerCase()
          return mentorByEmail.get(emailKey) ?? mentorByName.get(normalizeKey(mentor))
        })
        .filter((id): id is number => !!id)

      if (mentorIds.length === 0) {
        skipped += 1
        errors.push(`Row ${index + 1}: no matching mentors`)
        continue
      }

      if (type === "mentor") {
        if (typeof row.peopleInLab !== "number" || !row.feeling) {
          skipped += 1
          errors.push(`Row ${index + 1}: missing peopleInLab or feeling`)
          continue
        }

        const entry = await prisma.mentorHeadcountEntry.create({
          data: {
            semesterId: targetSemesterId,
            peopleInLab: row.peopleInLab,
            feeling: row.feeling,
            createdAt,
            mentors: {
              createMany: {
                data: mentorIds.map((mentorId) => ({ mentorId })),
              },
            },
          },
        })

        if (entry) created += 1
      } else {
        if (
          typeof row.studentsMentoredCount !== "number" ||
          typeof row.testsCheckedOutCount !== "number"
        ) {
          skipped += 1
          errors.push(`Row ${index + 1}: missing student/test counts`)
          continue
        }

        const entry = await prisma.menteeHeadcountEntry.create({
          data: {
            semesterId: targetSemesterId,
            studentsMentoredCount: row.studentsMentoredCount,
            testsCheckedOutCount: row.testsCheckedOutCount,
            otherClassText: row.otherClassText ?? null,
            createdAt,
            mentors: {
              createMany: {
                data: mentorIds.map((mentorId) => ({ mentorId })),
              },
            },
            classes: row.classes && row.classes.length > 0 ? {
              createMany: {
                data: row.classes
                  .map((value) => normalizeCourseCode(value))
                  .map((key) => courseMap.get(key))
                  .filter((id): id is number => !!id)
                  .map((courseId) => ({ courseId })),
              },
            } : undefined,
          },
        })

        if (entry) created += 1
      }
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      errors: errors.slice(0, 10),
    })
  } catch (error) {
    console.error("Error importing headcount data:", error)
    return NextResponse.json(
      { error: "Failed to import headcount data" },
      { status: 500 }
    )
  }
}
