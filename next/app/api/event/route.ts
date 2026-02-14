import { getPayloadClient } from "@/lib/payload";
import { isOfficerRequest, resolveMediaURL } from "@/lib/payloadCms";
import { NextRequest } from "next/server";

/**
 * HTTP GET request to /api/events/
 * @returns list of department objects
 */
function toEventResponse(doc: Record<string, any>) {
  return {
    id: String(doc.id),
    title: doc.title ?? "",
    description: doc.description ?? "",
    date: doc.date ?? "",
    image: resolveMediaURL(doc.image),
    location: doc.location ?? "",
    attendanceEnabled: Boolean(doc.attendanceEnabled),
    grantsMembership: Boolean(doc.grantsMembership),
  };
}

export async function GET() {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "events",
      depth: 1,
      limit: 1000,
      sort: "-date",
    });

    return Response.json(result.docs.map((doc) => toEventResponse(doc as Record<string, any>)));
  } catch {
    return Response.json(
      { error: "Failed GET request. Check your database connection." },
      { status: 500 }
    );
  }
}

/**
 * Create a new event
 * HTTP POST request to /api/events/
 * @param request { title: string, description: , date: string, image?: string, location?: string }
 * @return event object that was created
 */
export async function POST(request: NextRequest) {
  const isOfficer = await isOfficerRequest(request);
  if (!isOfficer) {
    return new Response("Only officers may modify events", { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    console.log("Invalid JSON in POST request to /api/event/");
    return new Response("Invalid JSON", { status: 422 });
  }

  if (!("title" in body && "description" in body && "date" in body)) {
    return new Response(
      '"title", "description", and "date" must be included in request body',
      { status: 422 }
    );
  }

  try {
    const payload = await getPayloadClient();
    const event = await payload.create({
      collection: "events",
      data: {
        title: body.title,
        description: body.description,
        date: body.date,
        location: body.location,
        attendanceEnabled: body.attendanceEnabled ?? false,
        grantsMembership: body.grantsMembership ?? false,
      },
    });
    return Response.json(toEventResponse(event as Record<string, any>), { status: 201 });
  } catch (e: any) {
    return new Response(`Failed to create event: ${e}`, { status: 500 });
  }
}

/**
 * HTTP DELETE request to /api/event
 * @param request { id: number }
 * @returns event object previously at { id }
 */
export async function DELETE(request: NextRequest) {
  const isOfficer = await isOfficerRequest(request);
  if (!isOfficer) {
    return new Response("Only officers may modify events", { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // verify the id is included
  if (!("id" in body)) {
    return new Response("ID must be included", { status: 422 });
  }
  try {
    const payload = await getPayloadClient();
    const event = await payload.delete({ collection: "events", id: body.id });
    return Response.json(toEventResponse(event as Record<string, any>));
  } catch {
    return new Response(`Couldn't find event ID ${body.id}`, { status: 404 });
  }
}

/**
 * Update an existing event
 * HTTP PUT request to /api/event
 * @param request { id: number, title?: string, description?: string, image?: string, date?: string, location?: string }
 * @returns updated event object
 */
export async function PUT(request: NextRequest) {
  const isOfficer = await isOfficerRequest(request);
  if (!isOfficer) {
    return new Response("Only officers may modify events", { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // verify that the id is included in the request
  if (!("id" in body)) {
    return new Response("ID must be included", { status: 422 });
  }
  const id = String(body.id);

  // only update included fields
  const data: {
    title?: string;
    description?: string;
    image?: string;
    date?: string | Date;
    location?: string;
    attendanceEnabled?: boolean;
    grantsMembership?: boolean;
  } = {};
  if ("title" in body) {
    data.title = body.title;
  }
  if ("description" in body) {
    data.description = body.description;
  }
  if ("image" in body) {
    data.image = body.image;
  }
  if ("date" in body) {
    data.date = body.date;
  }
  if ("location" in body) {
    data.location = body.location;
  }
  if ("attendanceEnabled" in body) {
    data.attendanceEnabled = body.attendanceEnabled;
  }
  if ("grantsMembership" in body) {
    data.grantsMembership = body.grantsMembership;
  }

  const payload = await getPayloadClient();
  const event = await payload.update({
    collection: "events",
    id,
    data,
  });

  return Response.json(toEventResponse(event as Record<string, any>));
}
