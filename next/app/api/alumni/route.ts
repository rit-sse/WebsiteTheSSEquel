import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/alumni
 * Gets all existing alumni
 * @returns [{is_active: boolean, start_date: date, end_date: date,
 *            user: {name: string, email: string},
 */
export async function GET() {
  const alumni = await prisma.alumni.findMany({
    select: {
      is_active: true,
      start_date: true,
      end_date: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      }
    },
  });
  return Response.json(alumni);
}

/**
 * HTTP POST request to /api/alumni
 * Create a new alumni
 * @param request {user_email: string, start_date: date, end_date: date}
 */
export async function POST(request: Request) {
  const body = await request.json();
  if (
    !(
      "user_email" in body &&
      "start_date" in body &&
      "end_date" in body
    )
  ) {
    return new Response(
      ' "user_email","start_date" and "end_date" are all required',
      { status: 400 }
    );
  }
  const { user_email, start_date, end_date } = body;
  const user_id = (
    await prisma.user.findFirst({
      where: { email: user_email },
      select: { id: true },
    })
  )?.id;
}
/**
 * HTTP PUT request to /api/alumni
 * Update an existing alumni
 * @param request {id: number, start_date?: date, end_date?: date}
 * @returns updated alumni object
 */
export async function PUT(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // verify that the id is included in the request
  if (!("id" in body)) {
    return new Response("`id` must be included in request body", {
      status: 422,
    });
  }
  const id = body.id;

  // only include updated fields
  const data: {
    start_date?: string;
    end_date?: string;
  } = {};
  if ("start_date" in body) {
    data.start_date = body.start_date;
  }
  if ("end_date" in body) {
    data.end_date = body.end_date;
  }

  // apply updates to database
  try {
    const alumni = await prisma.alumni.update({ where: { id }, data });
    return Response.json(alumni);
  } catch (e) {
    // make sure the selected alumni exists
    return new Response(`Failed to update alumni: ${e}`, { status: 500 });
  }
}
