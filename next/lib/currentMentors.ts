import prisma from "@/lib/prisma";
import { mentorProfileSelect, toMentorProfile } from "@/lib/mentorProfiles";

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
  const now = new Date();
  const currentMentoringHours = getCurrentMentoringSlot(now);
  const mentors = await prisma.scheduleBlock.findMany({
    where: {
      weekday: { equals: currentMentoringHours.weekday },
      startHour: currentMentoringHours.startHour,
      schedule: {
        isActive: true,
      },
      mentor: {
        isActive: true,
        expirationDate: {
          gt: now,
        },
      },
    },
    select: {
      mentor: {
        select: mentorProfileSelect,
      },
    },
  });
  // A mentor can appear in more than one active schedule.
  return Array.from(
    new Map(
      mentors.map(({ mentor }) => [mentor.id, toMentorProfile(mentor)])
    ).values()
  );
}
