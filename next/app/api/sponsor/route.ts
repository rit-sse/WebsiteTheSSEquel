import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { CreateSponsorSchema, UpdateSponsorSchema } from "@/lib/schemas/sponsor";
import { ApiError } from "@/lib/apiError";

export async function GET() {
  try {
    const sponsors = await prisma.sponsor.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json(sponsors);
  } catch (error) {
    console.error("GET /api/sponsor error:", error);
    return ApiError.internal();
  }
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiError.validationError("Invalid JSON");
  }

  const parsed = CreateSponsorSchema.safeParse(body);
  if (!parsed.success) return ApiError.validationError("Validation failed", parsed.error.flatten());

  try {
    const sponsor = await prisma.sponsor.create({ data: parsed.data });
    return Response.json(sponsor, { status: 201 });
  } catch (error) {
    console.error("POST /api/sponsor error:", error);
    return ApiError.internal();
  }
}

export async function PUT(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiError.validationError("Invalid JSON");
  }

  const parsed = UpdateSponsorSchema.safeParse(body);
  if (!parsed.success) return ApiError.validationError("Validation failed", parsed.error.flatten());

  const { id, ...fields } = parsed.data;

  const sponsorExists = await prisma.sponsor.findUnique({ where: { id } });
  if (!sponsorExists) {
    return ApiError.notFound("Sponsor");
  }

  const data = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined)
  );

  const sponsor = await prisma.sponsor.update({ where: { id }, data });
  return Response.json(sponsor, { status: 200 });
}

export async function DELETE(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiError.validationError("Invalid JSON");
  }

  if (!("id" in body) || typeof body.id !== "number" || !Number.isInteger(body.id)) {
    return ApiError.badRequest("'id' must be a numeric integer");
  }

  const sponsorExists = await prisma.sponsor.findUnique({ where: { id: body.id } });
  if (!sponsorExists) {
    return ApiError.notFound("Sponsor");
  }

  const sponsor = await prisma.sponsor.delete({ where: { id: body.id } });
  return Response.json(sponsor, { status: 200 });
}
