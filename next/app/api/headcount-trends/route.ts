import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { parseAcademicTermLabel } from "@/lib/academicTerm"

export const dynamic = "force-dynamic"

export interface SemesterTrend {
  semesterId: number | null
  semesterName: string
  // mentor headcount (30-min form)
  mentorSubmissions: number
  avgPeopleInLab: number
  // mentee headcount (55-min form)
  menteeSubmissions: number
  avgStudentsMentored: number
  totalStudentsMentored: number
  avgTestsCheckedOut: number
  totalTestsCheckedOut: number
}

export async function GET() {
  const [mentorEntries, menteeEntries, semesters] = await Promise.all([
    prisma.mentorHeadcountEntry.findMany({
      select: {
        semesterId: true,
        peopleInLab: true,
        semester: { select: { id: true, name: true } },
      },
    }),
    prisma.menteeHeadcountEntry.findMany({
      select: {
        semesterId: true,
        studentsMentoredCount: true,
        testsCheckedOutCount: true,
        semester: { select: { id: true, name: true } },
      },
    }),
    prisma.mentorSemester.findMany({
      select: { id: true, name: true },
    }),
  ])

  // Sort semesters chronologically by parsed academic term name.
  // This ensures correct order even when all records were created at the same time
  // (e.g. bulk-importing years of historical data at once).
  // Term rank: Spring=1, Summer=0, Fall=2 → sortKey "YYYY-R" sorts correctly as a string.
  const termRank = (term: string) =>
    term === "FALL" ? 2 : term === "SPRING" ? 1 : 0

  function semesterSortKey(name: string): string {
    const parsed = parseAcademicTermLabel(name)
    if (!parsed) return name // unparseable names sort lexicographically
    return `${parsed.year}-${termRank(parsed.term)}`
  }

  semesters.sort((a, b) => semesterSortKey(a.name).localeCompare(semesterSortKey(b.name)))

  // Build a label map for all known semesters
  const semesterNames = new Map<number | null, string>()
  semesterNames.set(null, "Unassigned")
  for (const s of semesters) {
    semesterNames.set(s.id, s.name)
  }

  // Aggregate mentor headcount by semesterId
  const mentorMap = new Map<
    number | null,
    { totalPeople: number; count: number }
  >()
  for (const e of mentorEntries) {
    const key = e.semesterId
    const prev = mentorMap.get(key) ?? { totalPeople: 0, count: 0 }
    prev.totalPeople += e.peopleInLab
    prev.count += 1
    mentorMap.set(key, prev)
    // Capture semester name from relation if not already in map
    if (e.semesterId && e.semester && !semesterNames.has(e.semesterId)) {
      semesterNames.set(e.semesterId, e.semester.name)
    }
  }

  // Aggregate mentee headcount by semesterId
  const menteeMap = new Map<
    number | null,
    { totalStudents: number; totalTests: number; count: number }
  >()
  for (const e of menteeEntries) {
    const key = e.semesterId
    const prev = menteeMap.get(key) ?? { totalStudents: 0, totalTests: 0, count: 0 }
    prev.totalStudents += e.studentsMentoredCount
    prev.totalTests += e.testsCheckedOutCount
    prev.count += 1
    menteeMap.set(key, prev)
    if (e.semesterId && e.semester && !semesterNames.has(e.semesterId)) {
      semesterNames.set(e.semesterId, e.semester.name)
    }
  }

  // Collect all unique semesterIds that appear in either dataset
  const allKeys = new Set<number | null>([
    ...mentorMap.keys(),
    ...menteeMap.keys(),
  ])

  const trends: SemesterTrend[] = []

  // First emit known semesters in creation order (so charts are chronological)
  for (const s of semesters) {
    if (!allKeys.has(s.id)) continue
    allKeys.delete(s.id)

    const m = mentorMap.get(s.id)
    const me = menteeMap.get(s.id)

    trends.push({
      semesterId: s.id,
      semesterName: s.name,
      mentorSubmissions: m?.count ?? 0,
      avgPeopleInLab: m ? Math.round((m.totalPeople / m.count) * 10) / 10 : 0,
      menteeSubmissions: me?.count ?? 0,
      avgStudentsMentored: me ? Math.round((me.totalStudents / me.count) * 10) / 10 : 0,
      totalStudentsMentored: me?.totalStudents ?? 0,
      avgTestsCheckedOut: me ? Math.round((me.totalTests / me.count) * 10) / 10 : 0,
      totalTestsCheckedOut: me?.totalTests ?? 0,
    })
  }

  // Then emit any remaining keys (null / orphaned)
  for (const key of allKeys) {
    const m = mentorMap.get(key)
    const me = menteeMap.get(key)
    trends.push({
      semesterId: key,
      semesterName: semesterNames.get(key) ?? "Unassigned",
      mentorSubmissions: m?.count ?? 0,
      avgPeopleInLab: m ? Math.round((m.totalPeople / m.count) * 10) / 10 : 0,
      menteeSubmissions: me?.count ?? 0,
      avgStudentsMentored: me ? Math.round((me.totalStudents / me.count) * 10) / 10 : 0,
      totalStudentsMentored: me?.totalStudents ?? 0,
      avgTestsCheckedOut: me ? Math.round((me.totalTests / me.count) * 10) / 10 : 0,
      totalTestsCheckedOut: me?.totalTests ?? 0,
    })
  }

  return NextResponse.json(trends)
}
