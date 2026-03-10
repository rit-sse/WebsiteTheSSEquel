import prisma from "@/lib/prisma";
import { CreateEventSchema, UpdateEventSchema } from "@/lib/schemas/event";
import { ApiError } from "@/lib/apiError";

/**
 * HTTP GET request to /api/events/
 * @returns list of department objects
 */
export async function GET() {
  try{
  const allEvents = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        image: true,
        location: true,
        attendanceEnabled: true,
        grantsMembership: true,
      },
    });
    return Response.json(allEvents);
  }
  catch{
    // probably need to implement better error catching in the future >.<
    return Response.json(
      { error: "Failed GET request. Check your database connection." },
      { status: 500 }
    );
  }
}

/**
 * Create a new event
 * HTTP POST request to /api/events/
 * @param request { title: string, description: string, date: string, image?: string, location?: string }
 * @return event object that was created
 */
export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiError.validationError("Invalid JSON");
  }

  const parsed = CreateEventSchema.safeParse(body);
  if (!parsed.success) return ApiError.validationError("Validation failed", parsed.error.flatten());

  const { id, title, description, date, location, image, attendanceEnabled, grantsMembership } = parsed.data;

  try {
    const event = await prisma.event.create({
      data: {
        id,
        title,
        description,
        date,
        location,
        image,
        attendanceEnabled: attendanceEnabled ?? false,
        grantsMembership: grantsMembership ?? false,
      },
    });
    return Response.json(event, { status: 201 });
  } catch (e: any) {
    return ApiError.internal();
  }
}

/**
 * HTTP DELETE request to /api/event
 * @param request { id: number }
 * @returns event object previously at { id }
 */
export async function DELETE(request: Request) {
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

  // make sure the specified event exists
  try {
    const event = await prisma.event.delete({ where: { id } });
    return Response.json(event);
  } catch {
    return ApiError.notFound("Event");
  }
}

/**
 * Update an existing event
 * HTTP PUT request to /api/event
 * @param request { id: string, title?: string, description?: string, image?: string, date?: string, location?: string }
 * @returns updated event object
 */
export async function PUT(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiError.validationError("Invalid JSON");
  }

  const parsed = UpdateEventSchema.safeParse(body);
  if (!parsed.success) return ApiError.validationError("Validation failed", parsed.error.flatten());

  const { id, ...data } = parsed.data;

  // strip undefined fields so Prisma only updates what was provided
  const updateData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  try {
    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    });
    return Response.json(event);
  } catch (e: any) {
    if (e?.code === "P2025") return ApiError.notFound("Event");
    return ApiError.internal();
  }
}
