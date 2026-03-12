import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const myApplications = request.nextUrl.searchParams.get("my") === "true";

  if (!myApplications) {
    return NextResponse.json(
      { error: 'Only "my=true" is supported for this route right now' },
      { status: 400 }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const applications = await prisma.techCommitteeApplication.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching Tech Committee applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch Tech Committee applications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      ritEmail,
      yearLevel,
      experienceText,
      whyJoin,
      weeklyCommitment,
      preferredDivision,
    } = body ?? {};

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!ritEmail?.trim()) {
      return NextResponse.json({ error: "RIT email is required" }, { status: 400 });
    }
    if (!yearLevel?.trim()) {
      return NextResponse.json({ error: "Year level is required" }, { status: 400 });
    }
    if (!experienceText?.trim()) {
      return NextResponse.json({ error: "Experience is required" }, { status: 400 });
    }
    if (!whyJoin?.trim()) {
      return NextResponse.json(
        { error: "Why you want to join is required" },
        { status: 400 }
      );
    }
    if (!weeklyCommitment?.trim()) {
      return NextResponse.json(
        { error: "Weekly commitment is required" },
        { status: 400 }
      );
    }
    if (!preferredDivision?.trim()) {
      return NextResponse.json(
        { error: "Preferred division is required" },
        { status: 400 }
      );
    }

    if (name.trim() !== user.name.trim()) {
      return NextResponse.json(
        { error: "Name must match your signed-in account" },
        { status: 400 }
      );
    }

    if (ritEmail.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
      return NextResponse.json(
        { error: "RIT email must match your signed-in account" },
        { status: 400 }
      );
    }

    const application = await prisma.techCommitteeApplication.create({
      data: {
        userId: user.id,
        yearLevel: yearLevel.trim(),
        experienceText: experienceText.trim(),
        whyJoin: whyJoin.trim(),
        weeklyCommitment: weeklyCommitment.trim(),
        preferredDivision: preferredDivision.trim(),
        status: "pending",
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("Error creating Tech Committee application:", error);
    return NextResponse.json(
      { error: "Failed to submit Tech Committee application" },
      { status: 500 }
    );
  }
}
