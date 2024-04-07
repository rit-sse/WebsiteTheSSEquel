import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/**
 * HTTP GET request to /api/mentorSchedule
 *
 * {
 *      <weekday: string>: {
 *          <start time: number>: <mentor name: string>[]
 *      }
 * }
 *
 * @returns object of hour blocks, organized by weekday and start time, with mentor names included
 */
export async function GET() {
  const hourBlocks = await prisma.hourBlock.findMany({
    select: {
      weekday: true,
      startTime: true,
      schedule: {
        select: {
          mentor: {
            select: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const schedule: { [key: string]: { [key: number]: string[] } } = {};
  for (const day of weekdays) {
    schedule[day] = {};
  }

  for (const hourBlock of hourBlocks) {
    const scheduleDay = schedule[hourBlock.weekday];
    const startTime = hourBlock.startTime.getUTCHours();
    const blockMentors = [];
    for (const mentor of hourBlock.schedule) {
      blockMentors.push(mentor.mentor.user.name);
    }
    scheduleDay[startTime] = blockMentors;
  }

  return Response.json(schedule);
}