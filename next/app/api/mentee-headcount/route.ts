import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";

export const dynamic = "force-dynamic";

async function canSubmitHeadcount(request: NextRequest): Promise<boolean> {
  const authLevel = await getGatewayAuthLevel(request);
  return authLevel.isMentor || authLevel.isOfficer;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const semesterId = searchParams.get("semesterId");
  const limit = searchParams.get("limit");

  const whereClause = semesterId ? { semesterId: parseInt(semesterId) } : undefined;
  const take = limit ? parseInt(limit) : undefined;

  const entries = await prisma.menteeHeadcountEntry.findMany({
    where: whereClause,
    include: {
      mentors: {
        include: {
          mentor: {
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
          },
        },
      },
      classes: {
        include: {
          course: true,
        },
      },
      semester: {
        select: { id: true, name: true, isActive: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  if (!(await canSubmitHeadcount(request))) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const body = await request.json();
  const {
    mentorIds,
    studentsMentoredCount,
    testsCheckedOutCount,
    courseIds,
    otherClassText,
    semesterId,
  } = body;

  if (!Array.isArray(mentorIds) || mentorIds.length === 0) {
    return NextResponse.json({ error: "Mentors on duty are required" }, { status: 400 });
  }
  if (typeof studentsMentoredCount !== "number") {
    return NextResponse.json({ error: "Student count is required" }, { status: 400 });
  }
  if (typeof testsCheckedOutCount !== "number") {
    return NextResponse.json({ error: "Tests checked out count is required" }, { status: 400 });
  }

  let targetSemesterId = semesterId ? parseInt(semesterId) : null;
  if (!targetSemesterId) {
    const activeSemester = await prisma.mentorSemester.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    targetSemesterId = activeSemester?.id ?? null;
  }

  const entry = await prisma.menteeHeadcountEntry.create({
    data: {
      studentsMentoredCount,
      testsCheckedOutCount,
      otherClassText: otherClassText?.trim() || null,
      semesterId: targetSemesterId,
      mentors: {
        createMany: {
          data: mentorIds.map((mentorId: number) => ({ mentorId })),
        },
      },
      classes: Array.isArray(courseIds) && courseIds.length > 0 ? {
        createMany: {
          data: courseIds.map((courseId: number) => ({ courseId })),
        },
      } : undefined,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
