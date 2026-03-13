import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

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

async function getApplicationConfig() {
  return prisma.techCommitteeApplicationConfig.findUnique({
    where: { id: 1 },
  });
}

async function ensureApplicationsOpen() {
  const config = await getApplicationConfig();
  if (config && !config.isOpen) {
    return validationError("Tech Committee applications are currently closed");
  }
  return null;
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

  if (name.trim() !== user.name.trim()) {
    return {
      response: validationError("Name must match your signed-in account"),
    };
  }

  if (ritEmail.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
    return {
      response: validationError(
        "RIT email must match your signed-in account"
      ),
    };
  }

  return {
    data: {
      id: requireId ? Number(id) : undefined,
      yearLevel: yearLevel.trim(),
      experienceText: experienceText.trim(),
      whyJoin: whyJoin.trim(),
      weeklyCommitment: weeklyCommitment.trim(),
      preferredDivision: preferredDivision.trim(),
    },
  };
}

export async function GET(request: NextRequest) {
  const statusOnly = request.nextUrl.searchParams.get("status") === "true";
  const myApplications = request.nextUrl.searchParams.get("my") === "true";

  if (statusOnly) {
    try {
      const config = await getApplicationConfig();
      return NextResponse.json({
        isOpen: config?.isOpen ?? true,
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

    const openError = await ensureApplicationsOpen();
    if (openError) return openError;

    const existingActiveApplication =
      await prisma.techCommitteeApplication.findFirst({
        where: {
          userId: auth.user.id,
          status: {
            in: ["pending", "approved", "assigned"],
          },
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
        yearLevel: validated.data.yearLevel,
        experienceText: validated.data.experienceText,
        whyJoin: validated.data.whyJoin,
        weeklyCommitment: validated.data.weeklyCommitment,
        preferredDivision: validated.data.preferredDivision,
        status: "pending",
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
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

    const existingApplication = await prisma.techCommitteeApplication.findFirst({
      where: {
        id: validated.data.id,
        userId: auth.user.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existingApplication) {
      return validationError("Application not found", 404);
    }

    if (existingApplication.status !== "pending") {
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
