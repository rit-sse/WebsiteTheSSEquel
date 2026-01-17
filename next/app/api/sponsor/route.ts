import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const sponsors = await prisma.sponsor.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json(sponsors);
  } catch (error) {
    console.error("GET /api/sponsor error:", error);
    return new Response(`Database error: ${error}`, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // Validate required fields
  if (!("name" in body && "description" in body && "logoUrl" in body && "websiteUrl" in body)) {
    return new Response(
      "'name', 'description', 'logoUrl', 'websiteUrl' must be included in the body",
      { status: 400 }
    );
  }

  if (typeof body.name !== "string") {
    return new Response("'name' must be a string", { status: 422 });
  }
  if (typeof body.description !== "string") {
    return new Response("'description' must be a string", { status: 422 });
  }
  if (typeof body.logoUrl !== "string") {
    return new Response("'logoUrl' must be a string", { status: 422 });
  }
  if (typeof body.websiteUrl !== "string") {
    return new Response("'websiteUrl' must be a string", { status: 422 });
  }

  const data: {
    name: string;
    description: string;
    logoUrl: string;
    websiteUrl: string;
    isActive?: boolean;
  } = {
    name: body.name,
    description: body.description,
    logoUrl: body.logoUrl,
    websiteUrl: body.websiteUrl,
  };

  if ("isActive" in body) {
    if (typeof body.isActive !== "boolean") {
      return new Response("'isActive' must be a boolean", { status: 422 });
    }
    data.isActive = body.isActive;
  }

  try {
    const sponsor = await prisma.sponsor.create({ data });
    return Response.json(sponsor, { status: 201 });
  } catch (error) {
    console.error("POST /api/sponsor error:", error);
    return new Response(`Database error: ${error}`, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  if (!("id" in body)) {
    return new Response("'id' must be included in the body", { status: 400 });
  }

  if (typeof body.id !== "number") {
    return new Response("'id' must be an integer", { status: 422 });
  }

  const sponsorExists = await prisma.sponsor.findUnique({
    where: { id: body.id },
  });

  if (!sponsorExists) {
    return new Response(`Sponsor with 'id': ${body.id} doesn't exist`, {
      status: 404,
    });
  }

  const data: {
    name?: string;
    description?: string;
    logoUrl?: string;
    websiteUrl?: string;
    isActive?: boolean;
  } = {};

  if ("name" in body) {
    if (typeof body.name !== "string") {
      return new Response("'name' must be a string", { status: 422 });
    }
    data.name = body.name;
  }
  if ("description" in body) {
    if (typeof body.description !== "string") {
      return new Response("'description' must be a string", { status: 422 });
    }
    data.description = body.description;
  }
  if ("logoUrl" in body) {
    if (typeof body.logoUrl !== "string") {
      return new Response("'logoUrl' must be a string", { status: 422 });
    }
    data.logoUrl = body.logoUrl;
  }
  if ("websiteUrl" in body) {
    if (typeof body.websiteUrl !== "string") {
      return new Response("'websiteUrl' must be a string", { status: 422 });
    }
    data.websiteUrl = body.websiteUrl;
  }
  if ("isActive" in body) {
    if (typeof body.isActive !== "boolean") {
      return new Response("'isActive' must be a boolean", { status: 422 });
    }
    data.isActive = body.isActive;
  }

  const sponsor = await prisma.sponsor.update({
    where: { id: body.id },
    data,
  });

  return Response.json(sponsor, { status: 200 });
}

export async function DELETE(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  if (!("id" in body)) {
    return new Response("'id' must be included in the body", { status: 400 });
  }

  if (typeof body.id !== "number") {
    return new Response("'id' must be an integer", { status: 422 });
  }

  const sponsorExists = await prisma.sponsor.findUnique({
    where: { id: body.id },
  });

  if (!sponsorExists) {
    return new Response(`Sponsor with 'id': ${body.id} doesn't exist`, {
      status: 404,
    });
  }

  const sponsor = await prisma.sponsor.delete({
    where: { id: body.id },
  });

  return Response.json(sponsor, { status: 200 });
}
