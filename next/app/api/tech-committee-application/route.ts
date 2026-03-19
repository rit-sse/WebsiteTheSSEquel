import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import { TECH_COMMITTEE_APPLICATION_LIMITS } from "@/lib/techCommitteeApplication";

export const dynamic = "force-dynamic";

type ApplicantIdentity = {
  id: number;
  name: string;
  email: string;
};

type ApplicationPayload = {
  id?: number;
  name?: string;
  ritEmail?: string;
  yearLevel?: string;
  experienceText?: string;
  whyJoin?: string;
  weeklyCommitment?: string;
  preferredDivision?: string;
};

function validationError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function validateMaxLength(
  value: string,
  fieldLabel: string,
  maxLength: number
) {
  if (value.length > maxLength) {
    return validationError(
      `${fieldLabel} must be ${maxLength} characters or fewer`
    );
  }

  return null;
}

async function getSignedInApplicant(): Promise<
  { user: ApplicantIdentity } | { response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      response: validationError("Unauthorized - please sign in", 401),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    return {
      response: validationError("User not found", 404),
    };
  }

  return { user };
}

async function getCurrentApplicationCycle() {
  return prisma.techCommitteeApplicationCycle.findFirst({
    orderBy: { createdAt: "desc" },
  });
}

async function getOpenApplicationCycle() {
  return prisma.techCommitteeApplicationCycle.findFirst({
    where: { isOpen: true },
    orderBy: { createdAt: "desc" },
  });
}

function parseAndValidatePayload(
  body: ApplicationPayload,
  user: ApplicantIdentity,
  requireId = false
) {
  const {
    id,
    name,
    ritEmail,
    yearLevel,
    experienceText,
    whyJoin,
    weeklyCommitment,
    preferredDivision,
  } = body ?? {};

  if (requireId && (!id || Number.isNaN(Number(id)))) {
    return { response: validationError("Application id is required") };
  }

  if (!name?.trim()) {
    return { response: validationError("Name is required") };
  }
  if (!ritEmail?.trim()) {
    return { response: validationError("RIT email is required") };
  }
  if (!yearLevel?.trim()) {
    return { response: validationError("Year level is required") };
  }
  if (!experienceText?.trim()) {
    return { response: validationError("Experience is required") };
  }
  if (!whyJoin?.trim()) {
    return { response: validationError("Why you want to join is required") };
  }
  if (!weeklyCommitment?.trim()) {
    return { response: validationError("Weekly commitment is required") };
  }
  if (!preferredDivision?.trim()) {
    return { response: validationError("Preferred division is required") };
  }

  const trimmedName = name.trim();
  const trimmedEmail = ritEmail.trim();
  const trimmedYearLevel = yearLevel.trim();
  const trimmedExperienceText = experienceText.trim();
  const trimmedWhyJoin = whyJoin.trim();
  const trimmedWeeklyCommitment = weeklyCommitment.trim();
  const trimmedPreferredDivision = preferredDivision.trim();

  const lengthError =
    validateMaxLength(
      trimmedName,
      "Name",
      TECH_COMMITTEE_APPLICATION_LIMITS.name
    ) ??
    validateMaxLength(
      trimmedEmail,
      "RIT email",
      TECH_COMMITTEE_APPLICATION_LIMITS.ritEmail
    ) ??
    validateMaxLength(
      trimmedYearLevel,
      "Year level",
      TECH_COMMITTEE_APPLICATION_LIMITS.yearLevel
    ) ??
    validateMaxLength(
      trimmedExperienceText,
      "Experience",
      TECH_COMMITTEE_APPLICATION_LIMITS.experienceText
    ) ??
    validateMaxLength(
      trimmedWhyJoin,
      "Why you want to join",
      TECH_COMMITTEE_APPLICATION_LIMITS.whyJoin
    ) ??
    validateMaxLength(
      trimmedWeeklyCommitment,
      "Weekly commitment",
      TECH_COMMITTEE_APPLICATION_LIMITS.weeklyCommitment
    ) ??
    validateMaxLength(
      trimmedPreferredDivision,
      "Preferred division",
      TECH_COMMITTEE_APPLICATION_LIMITS.preferredDivision
    );

  if (lengthError) {
    return { response: lengthError };
  }

  if (trimmedName !== user.name.trim()) {
    return {
      response: validationError("Name must match your signed-in account"),
    };
  }

  if (trimmedEmail.toLowerCase() !== user.email.trim().toLowerCase()) {
    return {
      response: validationError("RIT email must match your signed-in account"),
    };
  }

  return {
    data: {
      id: requireId ? Number(id) : undefined,
      yearLevel: trimmedYearLevel,
      experienceText: trimmedExperienceText,
      whyJoin: trimmedWhyJoin,
      weeklyCommitment: trimmedWeeklyCommitment,
      preferredDivision: trimmedPreferredDivision,
    },
  };
}

export async function GET(request: NextRequest) {
  const statusOnly = request.nextUrl.searchParams.get("status") === "true";
  const myApplications = request.nextUrl.searchParams.get("my") === "true";

  if (statusOnly) {
    try {
      const cycle = await getCurrentApplicationCycle();
      return NextResponse.json({
        isOpen: cycle?.isOpen ?? false,
      });
    } catch (error) {
      console.error("Error fetching Tech Committee application status:", error);
      return validationError(
        "Failed to fetch Tech Committee application status",
        500
      );
    }
  }

  if (!myApplications) {
    return validationError(
      'Only "my=true" or "status=true" is supported for this route right now'
    );
  }

  try {
    const auth = await getSignedInApplicant();
    if ("response" in auth) return auth.response;

    const applications = await prisma.techCommitteeApplication.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching Tech Committee applications:", error);
    return validationError("Failed to fetch Tech Committee applications", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getSignedInApplicant();
    if ("response" in auth) return auth.response;

    const body = await request.json();
    const validated = parseAndValidatePayload(body, auth.user);
    if ("response" in validated) return validated.response;

    const openCycle = await getOpenApplicationCycle();
    if (!openCycle) {
      return validationError(
        "Tech Committee applications are currently closed"
      );
    }

    const existingActiveApplication =
      await prisma.techCommitteeApplication.findFirst({
        where: {
          userId: auth.user.id,
          cycleId: openCycle.id,
        },
        select: { id: true },
      });

    if (existingActiveApplication) {
      return validationError(
        "You already have an active Tech Committee application",
        409
      );
    }

    const application = await prisma.techCommitteeApplication.create({
      data: {
        userId: auth.user.id,
        cycleId: openCycle.id,
        yearLevel: validated.data.yearLevel,
        experienceText: validated.data.experienceText,
        whyJoin: validated.data.whyJoin,
        weeklyCommitment: validated.data.weeklyCommitment,
        preferredDivision: validated.data.preferredDivision,
        status: "PENDING",
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return validationError(
        "You already have a Tech Committee application for the current cycle",
        409
      );
    }
    console.error("Error creating Tech Committee application:", error);
    return validationError("Failed to submit Tech Committee application", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getSignedInApplicant();
    if ("response" in auth) return auth.response;

    const body = await request.json();
    const validated = parseAndValidatePayload(body, auth.user, true);
    if ("response" in validated) return validated.response;

    const existingApplication = await prisma.techCommitteeApplication.findFirst(
      {
        where: {
          id: validated.data.id,
          userId: auth.user.id,
        },
        select: {
          id: true,
          status: true,
        },
      }
    );

    if (!existingApplication) {
      return validationError("Application not found", 404);
    }

    if (existingApplication.status !== "PENDING") {
      return validationError("Only pending applications can be edited", 409);
    }

    const updatedApplication = await prisma.techCommitteeApplication.update({
      where: { id: existingApplication.id },
      data: {
        yearLevel: validated.data.yearLevel,
        experienceText: validated.data.experienceText,
        whyJoin: validated.data.whyJoin,
        weeklyCommitment: validated.data.weeklyCommitment,
        preferredDivision: validated.data.preferredDivision,
      },
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error("Error updating Tech Committee application:", error);
    return validationError("Failed to update Tech Committee application", 500);
  }
}
