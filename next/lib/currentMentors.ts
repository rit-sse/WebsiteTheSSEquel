import prisma from "@/lib/prisma";

export function getCurrentMentoringSlot(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const weekDayName = parts.find((part) => part.type === "weekday")?.value;
  const hour = parts.find((part) => part.type === "hour")?.value;

  const weekdays: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };

  if (!weekDayName || hour === undefined) {
    throw new Error("Could not determine current mentoring slot!");
  }

  return {
    weekday: weekdays[weekDayName],
    startHour: Number(hour),
  };
}

export async function getCurrentMentors() {
  const currentMentoringHours = getCurrentMentoringSlot();
  const mentors = await prisma.scheduleBlock.findMany({
    where: {
      weekday: { equals: currentMentoringHours.weekday },
      startHour: currentMentoringHours.startHour,
      schedule: {
        isActive: true,
      },
      mentor: {
        isActive: true,
      },
    },
    select: {
      mentor: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              mentorApplications: {
                where: {
                  semester: {
                    isActive: true,
                  },
                },
                select: {
                  yearLevel: true,
                  major: true,
                },
              },
            },
          },
        },
      },
    },
  });
  return mentors;
}
