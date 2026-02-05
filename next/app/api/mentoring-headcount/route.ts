import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { MENTOR_HEAD_TITLE } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function canSubmitHeadcount(userEmail: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      mentor: {
        where: {
          isActive: true,
          expirationDate: { gte: new Date() },
        },
        select: { id: true },
      },
      officers: {
        where: { is_active: true },
        select: {
          position: {
            select: { title: true, is_primary: true },
          },
        },
      },
    },
  });

  if (!user) return false;

  const isOfficer = user.officers.some(
    (officer) =>
      officer.position.title === MENTOR_HEAD_TITLE ||
      officer.position.is_primary
  );

  return user.mentor.length > 0 || isOfficer;
}

function getWeekdayHour(date: Date) {
  const day = date.getDay();
  const weekday = day === 0 ? 7 : day; // 1=Mon, 7=Sun
  const hour = date.getHours();
  return { weekday, hour };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const semesterId = searchParams.get("semesterId");
  const traffic = searchParams.get("traffic") === "true";
  const limit = searchParams.get("limit");

  const whereClause = semesterId ? { semesterId: parseInt(semesterId) } : undefined;

  if (traffic) {
    const entries = await prisma.mentorHeadcountEntry.findMany({
      where: whereClause,
      select: { peopleInLab: true, createdAt: true },
    });

    const trafficMap = new Map<string, { total: number; count: number; weekday: number; hour: number }>();

    for (const entry of entries) {
      const { weekday, hour } = getWeekdayHour(entry.createdAt);
      if (weekday < 1 || weekday > 5) continue;
      const key = `${weekday}-${hour}`;
      const existing = trafficMap.get(key) ?? { total: 0, count: 0, weekday, hour };
      existing.total += entry.peopleInLab;
      existing.count += 1;
      trafficMap.set(key, existing);
    }

    const trafficData = Array.from(trafficMap.values()).map((item) => ({
      weekday: item.weekday,
      hour: item.hour,
      averagePeopleInLab: item.count > 0 ? item.total / item.count : 0,
      sampleCount: item.count,
    }));

    return NextResponse.json(trafficData);
  }

  const take = limit ? parseInt(limit) : undefined;
  const entries = await prisma.mentorHeadcountEntry.findMany({
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await canSubmitHeadcount(session.user.email))) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const body = await request.json();
  const { mentorIds, peopleInLab, feeling, semesterId } = body;

  if (!Array.isArray(mentorIds) || mentorIds.length === 0) {
    return NextResponse.json({ error: "Mentors on duty are required" }, { status: 400 });
  }
  if (typeof peopleInLab !== "number") {
    return NextResponse.json({ error: "People in lab is required" }, { status: 400 });
  }
  if (!feeling || typeof feeling !== "string") {
    return NextResponse.json({ error: "Feeling response is required" }, { status: 400 });
  }

  let targetSemesterId = semesterId ? parseInt(semesterId) : null;
  if (!targetSemesterId) {
    const activeSemester = await prisma.mentorSemester.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    targetSemesterId = activeSemester?.id ?? null;
  }

  const entry = await prisma.mentorHeadcountEntry.create({
    data: {
      peopleInLab,
      feeling: feeling.trim(),
      semesterId: targetSemesterId,
      mentors: {
        createMany: {
          data: mentorIds.map((mentorId: number) => ({ mentorId })),
        },
      },
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
