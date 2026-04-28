import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { resolveUserImage } from "@/lib/s3Utils";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { CreateMentorSchema, UpdateMentorSchema } from "@/lib/schemas/mentor";
import { ApiError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

function parseCourseCount(coursesJson: string | null | undefined): number {
  if (!coursesJson) return 0;
  try {
    const parsed = JSON.parse(coursesJson);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function parseCourses(coursesJson: string | null | undefined): string[] {
  if (!coursesJson) return [];
  try {
    const parsed = JSON.parse(coursesJson);
    return Array.isArray(parsed)
      ? parsed.filter((value) => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Check if user can manage mentors (Mentoring Head or Primary Officer)
 */
async function canManageMentors(request: NextRequest): Promise<boolean> {
  const authLevel = await getGatewayAuthLevel(request);
  return authLevel.isMentoringHead || authLevel.isPrimary;
}

/**
 * HTTP GET request to /api/mentor/
 * @return list of mentor objects with detailed information
 */
export async function GET(request: NextRequest) {
  const detailed = request.nextUrl.searchParams.get("detailed") === "true";

  const allMentors = await prisma.mentor.findMany({
    select: {
      id: true,
      isActive: true,
      expirationDate: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImageKey: true,
          googleImageURL: true,
          description: true,
          linkedIn: true,
          gitHub: true,
          ...(detailed && {
            mentorApplications: {
              orderBy: { createdAt: "desc" as const },
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
                createdAt: true,
                status: true,
                semester: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          }),
        },
      },
      ...(detailed && {
        mentorSkill: {
          select: {
            skill: {
              select: {
                id: true,
                skill: true,
              },
            },
          },
        },
        courseTaken: {
          select: {
            course: {
              select: {
                id: true,
                title: true,
                code: true,
                department: {
                  select: {
                    id: true,
                    title: true,
                    shortTitle: true,
                  },
                },
              },
            },
          },
        },
        scheduleBlocks: {
          select: {
            id: true,
            weekday: true,
            startHour: true,
            scheduleId: true,
          },
        },
      }),
    },
    orderBy: [{ isActive: "desc" }, { user: { name: "asc" } }],
  });

  const mentorsWithImage = allMentors.map((mentor) => {
    const latestApplication =
      "mentorApplications" in mentor.user
        ? mentor.user.mentorApplications?.[0]
        : undefined;
    const applicationCourseCount = parseCourseCount(
      latestApplication?.coursesJson
    );
    const applicationCourses = parseCourses(latestApplication?.coursesJson);

    const { mentorApplications, ...userWithoutApplications } =
      mentor.user as typeof mentor.user & {
        mentorApplications?: Array<{
          id: number;
          discordUsername: string;
          pronouns: string;
          major: string;
          yearLevel: string;
          coursesJson: string;
          skillsText: string;
          toolsComfortable: string;
          toolsLearning: string;
          previousSemesters: number;
          whyMentor: string;
          comments: string | null;
          createdAt: Date;
          status: string;
          semester: { id: number; name: string };
        }>;
      };

    return {
      ...mentor,
      applicationCourseCount,
      latestMentorApplication: latestApplication
        ? {
            ...latestApplication,
            courses: applicationCourses,
          }
        : null,
      user: {
        ...userWithoutApplications,
        image: resolveUserImage(
          mentor.user.profileImageKey,
          mentor.user.googleImageURL
        ),
      },
    };
  });

  return Response.json(mentorsWithImage);
}

/**
 * Create a new mentor
 * HTTP POST request to /api/mentor/
 * @param request { expirationDate: string, isActive: bool, userId: number }
 * @return mentor object that was created
 */
export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiError.validationError("Invalid JSON");
  }

  const parsed = CreateMentorSchema.safeParse(body);
  if (!parsed.success)
    return ApiError.validationError(
      "Validation failed",
      parsed.error.flatten()
    );

  const { expirationDate, isActive, userId } = parsed.data;

  // Only Mentoring Head or Primary Officers may modify mentors
  if (!(await canManageMentors(request))) {
    return ApiError.forbidden();
  }

  try {
    const mentor = await prisma.mentor.create({
      data: {
        expirationDate,
        isActive,
        user_Id: userId,
      },
    });
    return Response.json(mentor, { status: 201 });
  } catch (e) {
    return ApiError.internal();
  }
}

/**
 * HTTP DELETE request to /api/mentor
 * @param request { id: number }
 * @returns mentor object previously at { id }
 */
export async function DELETE(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiError.validationError("Invalid JSON");
  }

  // verify the id is included
  if (!("id" in body)) {
    return ApiError.badRequest("ID must be included");
  }
  const id = body.id;

  // Only Mentoring Head or Primary Officers may modify mentors
  if (!(await canManageMentors(request))) {
    return ApiError.forbidden();
  }

  // mentor object from database
  const mentorExists = await prisma.mentor.findUnique({ where: { id: id } });
  if (mentorExists == null) {
    return ApiError.notFound("Mentor");
  }

  const mentor = await prisma.$transaction(async (tx) => {
    const mentorRecord = await tx.mentor.findUnique({
      where: { id },
      select: { user_Id: true },
    });

    if (!mentorRecord) {
      throw new Error(`Couldn't find mentor ID ${id}`);
    }

    // Delete related records
    await tx.courseTaken.deleteMany({
      where: { mentorId: id },
    });
    await tx.mentorSkill.deleteMany({
      where: { mentor_Id: id },
    });
    await tx.schedule.deleteMany({
      where: { mentorId: id },
    });
    await tx.scheduleBlock.deleteMany({
      where: { mentorId: id },
    });

    // Remove the mentor's applications when they are removed from roster.
    const applicationIds = await tx.mentorApplication.findMany({
      where: { userId: mentorRecord.user_Id },
      select: { id: true },
    });

    if (applicationIds.length > 0) {
      await tx.invitation.deleteMany({
        where: {
          applicationId: {
            in: applicationIds.map((application) => application.id),
          },
        },
      });

      await tx.mentorApplication.deleteMany({
        where: { userId: mentorRecord.user_Id },
      });
    }

    return tx.mentor.delete({ where: { id } });
  });
  return Response.json(mentor);
}

/**
 * Update an existing mentor
 * HTTP PUT request to /api/mentor
 * @param request { id: number, expirationDate?: string, isActive?: bool, userId?: number }
 * @returns updated mentor object
 */
export async function PUT(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiError.validationError("Invalid JSON");
  }

  const parsed = UpdateMentorSchema.safeParse(body);
  if (!parsed.success)
    return ApiError.validationError(
      "Validation failed",
      parsed.error.flatten()
    );

  const { id, expirationDate, isActive, userId } = parsed.data;

  // Only Mentoring Head or Primary Officers may modify mentors
  if (!(await canManageMentors(request))) {
    return ApiError.forbidden();
  }

  // only update included fields
  const data: {
    expirationDate?: string;
    isActive?: boolean;
    user_Id?: number;
  } = {};
  if (expirationDate !== undefined) data.expirationDate = expirationDate;
  if (isActive !== undefined) data.isActive = isActive;
  if (userId !== undefined) data.user_Id = userId;

  try {
    const mentor = await prisma.mentor.update({
      where: { id },
      data,
    });
    return Response.json(mentor);
  } catch (e) {
    return ApiError.internal();
  }
}
