import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getGatewayAuthLevel } from "@/lib/authGateway"
import { getAcademicTermFromDate, formatAcademicTerm } from "@/lib/academicTerm"

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

async function canManageMentors(request: NextRequest): Promise<boolean> {
  const authLevel = await getGatewayAuthLevel(request)
  return authLevel.isMentoringHead || authLevel.isPrimary
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim()
}

function normalizeCourseCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

/**
 * Resolve (or create) the MentorSemester that corresponds to a given date.
 * Uses an in-memory cache so we only hit the DB once per unique term label.
 */
async function resolveSemesterId(
  date: Date,
  cache: Map<string, number>
): Promise<number> {
  const term = getAcademicTermFromDate(date)
  const year = date.getFullYear()
  const label = formatAcademicTerm(term, year)

  const cached = cache.get(label)
  if (cached !== undefined) return cached

  let semester = await prisma.mentorSemester.findFirst({
    where: { name: label },
    select: { id: true },
  })

  if (!semester) {
    semester = await prisma.mentorSemester.create({
      data: { name: label, isActive: false },
      select: { id: true },
    })
  }

  cache.set(label, semester.id)
  return semester.id
}

export async function POST(request: NextRequest) {
  try {
    const canManage = await canManageMentors(request)
    if (!canManage) {
      return NextResponse.json(
        { error: "Only Mentoring Head or Primary Officers can import headcount data" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { type, rows } = body as {
      type?: "mentor" | "mentee"
      rows?: ImportRow[]
    }

    if (!type || !rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      )
    }

    const mentors = await prisma.mentor.findMany({
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
    let duplicates = 0
    const semesterCache = new Map<string, number>()
    const errors: string[] = []

    // ── Phase 1: validate rows and resolve semesters ────────────────
    interface ValidatedRow {
      index: number
      row: ImportRow
      createdAt: Date
      semesterId: number
      mentorIds: number[]
    }
    const validated: ValidatedRow[] = []

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index]
      const createdAt = new Date(row.createdAt)
      if (Number.isNaN(createdAt.getTime())) {
        skipped += 1
        errors.push(`Row ${index + 1}: invalid timestamp`)
        continue
      }

      if (type === "mentor") {
        if (typeof row.peopleInLab !== "number" || !row.feeling) {
          skipped += 1
          errors.push(`Row ${index + 1}: missing peopleInLab or feeling`)
          continue
        }
      } else {
        if (
          typeof row.studentsMentoredCount !== "number" ||
          typeof row.testsCheckedOutCount !== "number"
        ) {
          skipped += 1
          errors.push(`Row ${index + 1}: missing student/test counts`)
          continue
        }
      }

      const semesterId = await resolveSemesterId(createdAt, semesterCache)
      const mentorIds = row.mentors
        .map((mentor) => {
          const emailKey = mentor.toLowerCase()
          return mentorByEmail.get(emailKey) ?? mentorByName.get(normalizeKey(mentor))
        })
        .filter((id): id is number => !!id)

      validated.push({ index, row, createdAt, semesterId, mentorIds })
    }

    // ── Phase 2: batch duplicate check ──────────────────────────────
    // Fetch all existing entries that could match the validated rows in
    // a single query per type, instead of one query per row.
    const toInsert: ValidatedRow[] = []

    if (type === "mentor" && validated.length > 0) {
      const timestamps = validated.map((v) => v.createdAt)
      const existing = await prisma.mentorHeadcountEntry.findMany({
        where: { createdAt: { in: timestamps } },
        select: { createdAt: true, peopleInLab: true, feeling: true, semesterId: true },
      })
      const existingSet = new Set(
        existing.map((e) => `${e.createdAt.toISOString()}|${e.peopleInLab}|${e.feeling}|${e.semesterId}`)
      )
      for (const v of validated) {
        const key = `${v.createdAt.toISOString()}|${v.row.peopleInLab}|${v.row.feeling}|${v.semesterId}`
        if (existingSet.has(key)) {
          duplicates += 1
        } else {
          toInsert.push(v)
        }
      }
    } else if (type === "mentee" && validated.length > 0) {
      const timestamps = validated.map((v) => v.createdAt)
      const existing = await prisma.menteeHeadcountEntry.findMany({
        where: { createdAt: { in: timestamps } },
        select: { createdAt: true, studentsMentoredCount: true, testsCheckedOutCount: true, semesterId: true },
      })
      const existingSet = new Set(
        existing.map((e) => `${e.createdAt.toISOString()}|${e.studentsMentoredCount}|${e.testsCheckedOutCount}|${e.semesterId}`)
      )
      for (const v of validated) {
        const key = `${v.createdAt.toISOString()}|${v.row.studentsMentoredCount}|${v.row.testsCheckedOutCount}|${v.semesterId}`
        if (existingSet.has(key)) {
          duplicates += 1
        } else {
          toInsert.push(v)
        }
      }
    }

    // ── Phase 3: insert non-duplicate rows ──────────────────────────
    for (const v of toInsert) {
      if (type === "mentor") {
        await prisma.mentorHeadcountEntry.create({
          data: {
            semesterId: v.semesterId,
            peopleInLab: v.row.peopleInLab!,
            feeling: v.row.feeling!,
            createdAt: v.createdAt,
            mentors: v.mentorIds.length > 0 ? {
              createMany: { data: v.mentorIds.map((mentorId) => ({ mentorId })) },
            } : undefined,
          },
        })
      } else {
        await prisma.menteeHeadcountEntry.create({
          data: {
            semesterId: v.semesterId,
            studentsMentoredCount: v.row.studentsMentoredCount!,
            testsCheckedOutCount: v.row.testsCheckedOutCount!,
            otherClassText: v.row.otherClassText ?? null,
            createdAt: v.createdAt,
            mentors: v.mentorIds.length > 0 ? {
              createMany: { data: v.mentorIds.map((mentorId) => ({ mentorId })) },
            } : undefined,
            classes: v.row.classes && v.row.classes.length > 0 ? {
              createMany: {
                data: v.row.classes
                  .map((value) => normalizeCourseCode(value))
                  .map((key) => courseMap.get(key))
                  .filter((id): id is number => !!id)
                  .map((courseId) => ({ courseId })),
              },
            } : undefined,
          },
        })
      }
      created += 1
    }

    const semestersUsed = [...semesterCache.keys()].sort()

    return NextResponse.json({
      success: true,
      created,
      skipped,
      duplicates,
      semestersUsed,
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

export async function DELETE(request: NextRequest) {
  try {
    const canManage = await canManageMentors(request)
    if (!canManage) {
      return NextResponse.json(
        { error: "Only Mentoring Head or Primary Officers can clear headcount data" },
        { status: 403 }
      )
    }

    const deleted = await prisma.$transaction(async (tx) => {
      const mentorMentors = await tx.mentorHeadcountMentor.deleteMany()
      const menteeMentors = await tx.menteeHeadcountMentor.deleteMany()
      const menteeCourses = await tx.menteeHeadcountCourse.deleteMany()
      const mentorEntries = await tx.mentorHeadcountEntry.deleteMany()
      const menteeEntries = await tx.menteeHeadcountEntry.deleteMany()
      return {
        mentorEntries: mentorEntries.count,
        menteeEntries: menteeEntries.count,
        joinRecords: mentorMentors.count + menteeMentors.count + menteeCourses.count,
      }
    })

    return NextResponse.json({ success: true, deleted })
  } catch (error) {
    console.error("Error clearing headcount data:", error)
    return NextResponse.json(
      { error: "Failed to clear headcount data" },
      { status: 500 }
    )
  }
}
