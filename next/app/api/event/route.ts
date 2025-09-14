import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
 * @param request { title: string, description: , date: string, image?: string, location?: string }
 * @return event object that was created
 */
export async function POST(request: Request) {
  console.log("POST request recvied to /api/event/");
  let body;
  try {
    body = await request.json();
  } catch {
    console.log("Invalid JSON in POST request to /api/event/");
    return new Response("Invalid JSON", { status: 422 });
  }

  // make sure the required properties are included
  if (!("title" in body && "description" in body && "date" in body && "id" in body)) {
    return new Response(
      '"id", "title", "description", and "date" must be included in request body',
      { status: 422 }
    );
  }
  const title = body.title;
  const description = body.description;
  let date = body.date;
  const id = body.id;
  const image = body.image;
  const location = body.location;

  console.log("Data being sent to Prisma:");
  console.log("  id:", id, `(${typeof id})`);
  console.log("  title:", title, `(${typeof title})`);
  console.log("  description:", description, `(${typeof description})`);
  console.log("  date (original string):", date, `(${typeof date})`); // Log the ISO string received
  // date = new Date(date).getTime()
  // const dateObject = new Date(date); // Create the Date object
  // console.log("  date (JS Date object):", date); // Log the object itself
  console.log("  location:", location, `(${typeof location})`);
  console.log("  image:", image, `(${typeof image})`);
  try {
    const event = await prisma.event.create({
      data: {
        id,
        title,
        description,
        date,
        location: body.location,
        image: body.image,
        id: body.id,
      },
    });
    return Response.json(event, { status: 201 });
  } catch (e: any) {
    // console.error(`Error Code: ${e.code}`);
    // console.error(`Error Message: ${e.message}`);
    // console.error(`Stack Trace: ${e.stack}`);
    return new Response(`Failed to create event: ${e}`, { status: 500 });
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
    return new Response("Invalid JSON", { status: 422 });
  }

  // verify the id is included
  if (!("id" in body)) {
    return new Response("ID must be included", { status: 422 });
  }
  const id = body.id;

  // make sure the specified event exists
  try {
    const event = await prisma.event.delete({ where: { id } });
    return Response.json(event);
  } catch {
    return new Response(`Couldn't find event ID ${id}`, { status: 404 });
  }
}

/**
 * Update an existing event
 * HTTP PUT request to /api/event
 * @param request { id: number, title?: string, description?: string, image?: string, date?: string, location?: string }
 * @returns updated event object
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
    return new Response("ID must be included", { status: 422 });
  }
  const id = body.id;

  // only update included fields
  const data: {
    title?: string;
    description?: string;
    image?: string;
    date?: string;
    location?: string;
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

  try {
    const event = await prisma.event.update({
      where: { id },
      data,
    });
    return Response.json(event);
  } catch (e) {
    // make sure the selected event exists
    return new Response(`Failed to update event: ${e}`, { status: 500 });
  }
}
