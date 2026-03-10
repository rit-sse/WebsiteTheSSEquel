import prisma from "@/lib/prisma";
import { getImageUrl } from "@/lib/s3Utils";
import { CreateAlumniSchema, UpdateAlumniSchema } from "@/lib/schemas/alumni";
import { ApiError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

/**
 * HTTP GET request to /api/alumni
 * Gets all existing alumni
 * @returns [{is_active: boolean, start_date: date, end_date: date,
 *            user: {name: string, email: string},
 */
export async function GET() {
  const alumni = await prisma.alumni.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      linkedIn: true,
      image: true,
      gitHub: true,
      description: true,
      start_date: true,
      end_date: true,
      quote: true,
      previous_roles: true
    },
  });
  return Response.json(
    alumni.map((entry) => ({
      ...entry,
      image: getImageUrl(entry.image),
      imageKey: entry.image,
    }))
  );
}

/**
 * HTTP POST request to /api/alumni
 * Create a new alumni
 * @param request {name: string, email: string, start_date: date, end_date: date}
 */
export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiError.validationError("Invalid JSON");
  }

  const parsed = CreateAlumniSchema.safeParse(body);
  if (!parsed.success) return ApiError.validationError("Validation failed", parsed.error.flatten());

  const { name, email, linkedIn, gitHub, start_date, end_date, quote, previous_roles, description, image, showEmail, receiveEmails } = parsed.data;

  // Set the new alumni
  try {
    const newAlumni = await prisma.alumni.create({
      data: {
        name,
        email,
        linkedIn: linkedIn || null,
        gitHub: gitHub || null,
        start_date,
        end_date,
        quote: quote || "",
        previous_roles: previous_roles || "",
        description: description || null,
        image: image || undefined,
        showEmail: showEmail === true,
        receiveEmails: receiveEmails === true,
      },
    });
    return Response.json(newAlumni);
  } catch (e) {
    return ApiError.internal();
  }
}

/**
 * HTTP PUT request to /api/alumni
 * Update an existing alumni
 * @param request {id: number, quote?: string, previous_roles?: string[], start_date?: date, end_date?: date}
 * @returns updated alumni object
 */
export async function PUT(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiError.validationError("Invalid JSON");
  }

  const parsed = UpdateAlumniSchema.safeParse(body);
  if (!parsed.success) return ApiError.validationError("Validation failed", parsed.error.flatten());

  const { id, ...fields } = parsed.data;

  const data = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined)
  );

  // apply updates to database
  try {
    const alumni = await prisma.alumni.update({ where: { id }, data });
    return Response.json(alumni);
  } catch (e) {
    return ApiError.internal();
  }
}

/**
 * HTTP DELETE request to /api/alumni
 * @param request {id:number}
 * @returns alumni object previously at { id }
 */
export async function DELETE(request: Request) {
  let body: any;

  try {
    body = await request.json();
  } catch (error) {
    return ApiError.validationError("Invalid JSON payload");
  }

  if (!("id" in body) || typeof body.id !== 'number') {
    return ApiError.badRequest("A numeric `id` must be included in the request body");
  }
  const id = body.id;

  try {
    const deletedAlumni = await prisma.alumni.delete({ where: { id } });
    return Response.json(deletedAlumni, { status: 200 });
  } catch (error: any) {
    return ApiError.internal();
  }
}
