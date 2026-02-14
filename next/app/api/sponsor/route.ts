import { getPayloadClient } from "@/lib/payload";
import { isOfficerRequest, resolveMediaURL } from "@/lib/payloadCms";
import { NextRequest } from "next/server";

function toSponsorResponse(doc: Record<string, any>) {
  return {
    id: Number(doc.id),
    name: doc.name ?? "",
    description: doc.description ?? "",
    logoUrl: resolveMediaURL(doc.logo),
    websiteUrl: doc.websiteUrl ?? "",
    isActive: Boolean(doc.isActive),
    createdAt: doc.createdAt ?? new Date().toISOString(),
    updatedAt: doc.updatedAt ?? new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const payload = await getPayloadClient();
    const sponsors = await payload.find({
      collection: "sponsors",
      depth: 1,
      limit: 1000,
      sort: "-createdAt",
    });
    return Response.json(
      sponsors.docs.map((doc) => toSponsorResponse(doc as Record<string, any>))
    );
  } catch (error) {
    console.error("GET /api/sponsor error:", error);
    return new Response(`Database error: ${error}`, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isOfficer = await isOfficerRequest(request);
  if (!isOfficer) {
    return new Response("Only officers may modify sponsors", { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  if (!("name" in body && "description" in body && "websiteUrl" in body)) {
    return new Response(
      "'name', 'description', and 'websiteUrl' must be included in the body",
      { status: 400 }
    );
  }

  if (typeof body.name !== "string") {
    return new Response("'name' must be a string", { status: 422 });
  }
  if (typeof body.description !== "string") {
    return new Response("'description' must be a string", { status: 422 });
  }
  if (typeof body.websiteUrl !== "string") {
    return new Response("'websiteUrl' must be a string", { status: 422 });
  }

  const data: {
    name: string;
    description: string;
    websiteUrl: string;
    isActive?: boolean;
  } = {
    name: body.name,
    description: body.description,
    websiteUrl: body.websiteUrl,
  };

  if ("isActive" in body) {
    if (typeof body.isActive !== "boolean") {
      return new Response("'isActive' must be a boolean", { status: 422 });
    }
    data.isActive = body.isActive;
  }

  try {
    const payload = await getPayloadClient();
    const sponsor = await payload.create({
      collection: "sponsors",
      data,
    });
    return Response.json(toSponsorResponse(sponsor as Record<string, any>), { status: 201 });
  } catch (error) {
    console.error("POST /api/sponsor error:", error);
    return new Response(`Database error: ${error}`, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const isOfficer = await isOfficerRequest(request);
  if (!isOfficer) {
    return new Response("Only officers may modify sponsors", { status: 403 });
  }

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

  const data: {
    name?: string;
    description?: string;
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

  const payload = await getPayloadClient();
  const sponsor = await payload.update({
    collection: "sponsors",
    id: body.id,
    data,
  });

  return Response.json(toSponsorResponse(sponsor as Record<string, any>), { status: 200 });
}

export async function DELETE(request: NextRequest) {
  const isOfficer = await isOfficerRequest(request);
  if (!isOfficer) {
    return new Response("Only officers may modify sponsors", { status: 403 });
  }

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

  const payload = await getPayloadClient();
  const sponsor = await payload.delete({
    collection: "sponsors",
    id: body.id,
  });

  return Response.json(toSponsorResponse(sponsor as Record<string, any>), { status: 200 });
}
