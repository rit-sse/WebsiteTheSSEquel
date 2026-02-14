import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { resolveUserImage } from "@/lib/s3Utils";
import { MENTOR_HEAD_TITLE } from "@/lib/utils";

export const dynamic = "force-dynamic";

function parseCourses(coursesJson: string | null | undefined): string[] {
  if (!coursesJson) return [];
  try {
    const parsed = JSON.parse(coursesJson);
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function parseAvailability(slotsJson: string | null | undefined): Array<{ weekday: number; hour: number }> {
  if (!slotsJson) return [];
  try {
    const parsed = JSON.parse(slotsJson);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (slot): slot is { weekday: number; hour: number } =>
        typeof slot?.weekday === "number" && typeof slot?.hour === "number"
    );
  } catch {
    return [];
  }
}

/**
 * GET /api/user/[id]/profile
 * Returns a user's public profile data including memberships, projects, and officer roles.
 * Email is only included for the owner or an active officer.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const { id: idParam } = await params;
  const id = parseInt(idParam);
  if (isNaN(id)) {
    return new Response("Invalid User ID", { status: 422 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      profileImageKey: true,
      googleImageURL: true,
      linkedIn: true,
      gitHub: true,
      description: true,
      graduationTerm: true,
      graduationYear: true,
      major: true,
      coopSummary: true,
      Memberships: {
        select: {
          id: true,
          reason: true,
          dateGiven: true,
        },
        orderBy: { dateGiven: "desc" },
      },
      projectContributions: {
        select: {
          project: {
            select: {
              id: true,
              title: true,
              description: true,
              repoLink: true,
            },
          },
        },
      },
      officers: {
        select: {
          id: true,
          is_active: true,
          start_date: true,
          end_date: true,
          position_id: true,
          position: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { start_date: "desc" },
      },
      mentor: {
        select: {
          id: true,
          isActive: true,
          expirationDate: true,
          scheduleBlocks: {
            where: {
              schedule: {
                isActive: true,
              },
            },
            select: {
              id: true,
              weekday: true,
              startHour: true,
            },
            orderBy: [{ weekday: "asc" }, { startHour: "asc" }],
          },
        },
      },
      mentorApplications: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          discordUsername: true,
          pronouns: true,
          major: true,
          yearLevel: true,
          coursesJson: true,
          skillsText: true,
          toolsComfortable: true,
          toolsLearning: true,
          previousSemesters: true,
          whyMentor: true,
          comments: true,
          status: true,
          createdAt: true,
          semester: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return new Response(`User ${id} not found`, { status: 404 });
  }

  // Public profile route: anyone can view profile fields.
  // Email remains private unless owner or active officer.
  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.email === user.email;
  const isOfficer = session?.user?.email
    ? await prisma.user.findFirst({
        where: {
          email: session.user.email,
          officers: {
            some: {
              is_active: true,
            },
          },
        },
        select: { id: true },
      })
    : null;

  const projects = user.projectContributions.map((pc) => pc.project);
  const mentoringHead = await prisma.officer.findFirst({
    where: {
      is_active: true,
      position: {
        title: MENTOR_HEAD_TITLE,
      },
    },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const latestMentorApplication = user.mentorApplications[0];
  const activeSemester = await prisma.mentorSemester.findFirst({
    where: { isActive: true },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
  });
  const mentorAvailability = activeSemester
    ? await prisma.mentorAvailability.findUnique({
        where: {
          userId_semesterId: {
            userId: user.id,
            semesterId: activeSemester.id,
          },
        },
        select: { slots: true },
      })
    : null;
  const availabilitySlots = parseAvailability(mentorAvailability?.slots);

  return Response.json({
    id: user.id,
    name: user.name,
    email: isOwner || !!isOfficer ? user.email : undefined,
    image: resolveUserImage(user.profileImageKey, user.googleImageURL),
    profileImageKey: user.profileImageKey ?? null,
    linkedIn: user.linkedIn,
    gitHub: user.gitHub,
    description: user.description,
    graduationTerm: user.graduationTerm,
    graduationYear: user.graduationYear,
    major: user.major,
    coopSummary: user.coopSummary,
    membershipCount: user.Memberships.length,
    memberships: user.Memberships,
    projects,
    officerRoles: user.officers,
    mentorProfile:
      user.mentor.length > 0
        ? {
            id: user.mentor[0].id,
            isActive: user.mentor[0].isActive,
            expirationDate: user.mentor[0].expirationDate,
            availability: availabilitySlots,
            shifts: user.mentor[0].scheduleBlocks.map((slot) => ({
              id: slot.id,
              weekday: slot.weekday,
              dayLabel: DAYS[slot.weekday - 1] ?? "Unknown",
              startHour: slot.startHour,
              label: `${DAYS[slot.weekday - 1] ?? "Unknown"} ${slot.startHour}:00-${
                slot.startHour + 1
              }:00`,
            })),
            latestApplication: latestMentorApplication
              ? {
                  ...latestMentorApplication,
                  courses: parseCourses(latestMentorApplication.coursesJson),
                }
              : null,
            mentoringHead: mentoringHead
              ? {
                  id: mentoringHead.user.id,
                  name: mentoringHead.user.name,
                  email: mentoringHead.user.email,
                }
              : null,
          }
        : null,
    isOwner: !!isOwner,
  });
}
