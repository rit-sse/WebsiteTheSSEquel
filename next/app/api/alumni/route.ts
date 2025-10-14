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
  // If we couldn't find the user ID, give up
  if (user_id === undefined) {
    return new Response("User and position not found", { status: 404 });
  }

  // only include updated fields
  const data: {
    user_id?: number,
    linkedIn?: string,
    gitHub?: string,
    description?: string,
    quote?: string,
    previous_roles?: string[],
    start_date?: string;
    end_date?: string;
  } = {};

  data.user_id = body.user_id;

  if ("linkedIn" in body) {
    data.linkedIn = body.linkedIn;
  }
  if ("gitHub" in body) {
    data.gitHub = body.gitHub;
  }
  if ("description" in body) {
    data.description = body.description;
  }
  if ("quote" in body) {
    data.quote = body.quote;
  }
  if ("previous_roles" in body) {
    data.previous_roles = body.previous_roles;
  }
  if ("start_date" in body) {
    data.start_date = body.start_date;
  }
  if ("end_date" in body) {
    data.end_date = body.end_date;
  }
  // Set the new alumni
  try {
    const newAlumni = await prisma.alumni.create({ data: {user_id, start_date, end_date} });
    return Response.json(newAlumni);
  } catch (e) {
    // make sure the alumni was created
    return new Response(`Failed to create alumni: ${e}`, { status: 500 });
  }
  
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

/**
 * HTTP DELETE request to /api/alumni
 * @param request {id:number}
 * @returns alumni object previously at { id }
 */
export async function DELETE(request: Request) {
  console.log("received delete request");
  let body: any;

  try {
    body = await request.json();
  } catch (error) {
    console.error("Failed to parse request JSON:", error);
    return new Response("Invalid JSON payload", { status: 400 });
  }

  console.log(typeof body.id)
  if (!("id" in body) || typeof body.id !== 'number') {
    return new Response("A numeric `id` must be included in the request body", { status: 400 });
  }
  const id = body.id;

  try {
    console.log(`Attempting to delete Alumni with ID: ${id}`);
    const deletedAlumni = await prisma.alumni.delete({ where: { id } });
    console.log(`Successfully deleted Alumni ID: ${id}`, deletedAlumni);
    return Response.json(deletedAlumni, { status: 200 });

  } catch (error: any) {
    console.error(`!!! ERROR Deleting Alumni ID ${id} !!!`);
    console.error("Error Code:", error.code);
    console.error("Full Error Object:", JSON.stringify(error, null, 2));
    console.error("Stack Trace:", error.stack);

    // If we couldn't find the ID, give up
    if (id === undefined) {
      return new Response("Alumni ID not found", { status: 404 });
    }
    return new Response("Failed to delete Alumni due to a server error.", { status: 500 });
  }
}
