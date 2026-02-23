import prisma from "@/lib/prisma";
import { getSessionToken } from "@/lib/sessionToken";
import { NextRequest } from "next/server";
import { AlumniCandidateStatus, AlumniSource } from "@prisma/client";
import { formatAcademicTerm } from "@/lib/academicTerm";

export const dynamic = "force-dynamic";

async function requireOfficer(request: NextRequest) {
  const authToken = getSessionToken(request);
  if (!authToken) return null;

  return prisma.user.findFirst({
    where: {
      session: { some: { sessionToken: authToken } },
      officers: { some: { is_active: true } },
    },
    select: { id: true, name: true, email: true },
  });
}

export async function GET(request: NextRequest) {
  const officer = await requireOfficer(request);
  if (!officer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const statusParam = request.nextUrl.searchParams.get("status");
  const status = statusParam as AlumniCandidateStatus | null;

  const candidates = await prisma.alumniCandidate.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return Response.json(candidates);
}

export async function PUT(request: NextRequest) {
  const officer = await requireOfficer(request);
  if (!officer) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { id?: number; status?: AlumniCandidateStatus; reviewNotes?: string };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (typeof body.id !== "number" || !body.status) {
    return new Response("`id` and `status` are required", { status: 422 });
  }
  if (!["pending", "approved", "rejected"].includes(body.status)) {
    return new Response("Invalid status value", { status: 422 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const candidate = await tx.alumniCandidate.findUnique({
        where: { id: body.id },
      });
      if (!candidate) {
        throw new Error("NOT_FOUND");
      }

      if (body.status === "approved") {
        const alumniPayload = {
          name: candidate.name,
          email: candidate.email,
          linkedIn: candidate.linkedIn,
          gitHub: candidate.gitHub,
          description: candidate.description,
          image: candidate.imageKey ?? "https://source.boringavatars.com/beam/",
          start_date: "Unknown",
          end_date:
            candidate.graduationTerm && candidate.graduationYear
              ? formatAcademicTerm(candidate.graduationTerm, candidate.graduationYear)
              : "Unknown",
          source: AlumniSource.from_user,
          userId: candidate.userId,
          graduationTerm: candidate.graduationTerm,
          graduationYear: candidate.graduationYear,
        };

        const existing = await tx.alumni.findFirst({
          where: {
            OR: [{ userId: candidate.userId }, { email: candidate.email }],
          },
          select: { id: true },
        });

        if (existing) {
          await tx.alumni.update({
            where: { id: existing.id },
            data: alumniPayload,
          });
        } else {
          await tx.alumni.create({ data: alumniPayload });
        }
      }

      return tx.alumniCandidate.update({
        where: { id: body.id },
        data: {
          status: body.status,
          reviewedById: officer.id,
          reviewedAt: new Date(),
          reviewNotes: body.reviewNotes ?? null,
        },
      });
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return new Response("Candidate not found", { status: 404 });
    }
    return new Response(`Failed to review candidate: ${error}`, { status: 500 });
  }
}
