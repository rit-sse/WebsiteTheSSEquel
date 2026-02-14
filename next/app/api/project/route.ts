import { getPayloadClient } from "@/lib/payload";
import { isOfficerRequest, resolveMediaURL } from "@/lib/payloadCms";
import { NextRequest } from "next/server";

function toProjectResponse(doc: Record<string, any>) {
  return {
    id: Number(doc.id),
    title: doc.title ?? "",
    description: doc.description ?? "",
    leadid: Number(doc.lead ?? 0),
    progress: doc.progress ?? "",
    repoLink: doc.repoLink ?? "",
    contentURL: doc.contentURL ?? (doc.slug ? `/projects/${doc.slug}` : ""),
    projectImage: resolveMediaURL(doc.projectImage),
    completed: Boolean(doc.completed),
    slug: doc.slug ?? "",
    content: doc.content ?? null,
  };
}

export async function GET() {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "projects",
    depth: 1,
    limit: 1000,
    sort: "title",
  });

  return Response.json(result.docs.map((doc) => toProjectResponse(doc as Record<string, any>)));
}

export async function POST(request: NextRequest) {
  const isOfficer = await isOfficerRequest(request);
  if (!isOfficer) {
    return new Response("Only officers may modify projects", { status: 403 });
  }

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  if (typeof body.title !== "string" || typeof body.description !== "string") {
    return new Response("'title' and 'description' must be strings", { status: 422 });
  }

  const payload = await getPayloadClient();
  const created = await payload.create({
    collection: "projects",
    data: {
      title: body.title,
      description: body.description,
      lead: typeof body.leadid === "number" ? body.leadid : undefined,
      progress: typeof body.progress === "string" ? body.progress : undefined,
      repoLink: typeof body.repoLink === "string" ? body.repoLink : undefined,
      contentURL: typeof body.contentURL === "string" ? body.contentURL : undefined,
      completed: Boolean(body.completed),
    },
  });

  return Response.json(toProjectResponse(created as Record<string, any>), { status: 201 });
}

export async function PUT(request: NextRequest) {
  const isOfficer = await isOfficerRequest(request);
  if (!isOfficer) {
    return new Response("Only officers may modify projects", { status: 403 });
  }

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  const id = Number(body.id);
  if (!Number.isFinite(id)) {
    return new Response("'id' must be an integer", { status: 422 });
  }

  const payload = await getPayloadClient();
  const updated = await payload.update({
    collection: "projects",
    id,
    data: {
      title: typeof body.title === "string" ? body.title : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      lead: typeof body.leadid === "number" ? body.leadid : undefined,
      progress: typeof body.progress === "string" ? body.progress : undefined,
      repoLink: typeof body.repoLink === "string" ? body.repoLink : undefined,
      contentURL: typeof body.contentURL === "string" ? body.contentURL : undefined,
      completed: typeof body.completed === "boolean" ? body.completed : undefined,
    },
  });

  return Response.json(toProjectResponse(updated as Record<string, any>));
}

export async function DELETE(request: NextRequest) {
  const isOfficer = await isOfficerRequest(request);
  if (!isOfficer) {
    return new Response("Only officers may modify projects", { status: 403 });
  }

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  const id = Number(body.id);
  if (!Number.isFinite(id)) {
    return new Response("'id' must be an integer", { status: 422 });
  }

  const payload = await getPayloadClient();
  const deleted = await payload.delete({
    collection: "projects",
    id,
  });

  return Response.json(toProjectResponse(deleted as Record<string, any>));
}
