import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * HTTP GET request to api/quotes
 * @returns list of quote objects in model
 */
export async function GET() {
  const quotes = await prisma.quote.findMany({
    select: {
      date_added: true,
      quote: true,
      user_id: true,
      user: {
        // testing purposes only, may remove later
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      author: true,
    },
  });
  return Response.json(quotes);
}

/**
 * POST request to /api/quote
 * @param request { dateAdded: Date, quote: string, userId: number, author?: string }
 * @returns quote object that was created
 */

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  //validate request body
  if (!("dateAdded" in body && "quote" in body && "userId" in body)) {
    return new Response(
      '"userId", "dateAdded", "quote", must be included in request body',
      { status: 400 }
    );
  }

  const date_added = new Date(body.dateAdded);
  const quote = body.quote;
  const user_id = body.userId;

  // fill in author key if one was specified by user. Otherwise, leave it anonymous
  let author;
  if ("author" in body) {
    author = body.author;
  }

  try {
    const create_quote = await prisma.quote.create({
      data: {
        date_added,
        quote,
        user_id,
        author,
      },
    });
    return Response.json(create_quote, { status: 201 });
  } catch (e) {
    return new Response(`Failed to create quote: ${e}`, { status: 500 });
  }
}

/**
 * PUT request to /api/quote
 * @param request { dateAdded?: Date, quote?: string, userId?: number, author?: string }
 * @returns updated quote object
 */
export async function PUT(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  //check if id is in request
  if (!("id" in body)) {
    return new Response('"id" must be included in request body', {
      status: 400,
    });
  }
  const id = body.id;

  //check if user_id is valid
  try {
    prisma.user.findUniqueOrThrow({
      where: { id: body.userId },
    });
  } catch {
    return new Response("invalid userId value", { status: 404 });
  }

  const data: {
    date_added?: Date;
    quote?: string;
    user_id?: number;
    author?: string;
  } = {};

  if ("dateAdded" in body) {
    data.date_added = new Date(body.dateAdded);
  }

  if ("quote" in body) {
    data.quote = body.quote;
  }

  if ("userId" in body) {
    data.user_id = body.userId;
  }

  if ("author" in body) {
    data.author = body.author;
  }

  try {
    const quote = await prisma.quote.update({
      where: { id },
      data,
    });
    return Response.json(quote);
  } catch (e) {
    return new Response(`Failed to update quote: ${e}`, { status: 500 });
  }
}

/**
 * DELETE request to /api/quote
 * @param request { id: number }
 * @returns quote object that was deleted at { id }
 */

//TODO: Test
export async function DELETE(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  //verify id is included
  if (!("id" in body)) {
    return new Response("id of quote must be included", { status: 422 });
  }

  const id = body.id;
  const quoteExists = prisma.quote.findUnique({ where: { id } });

  //validate quote existence
  if (!quoteExists) {
    return new Response("Could not find quote ID", { status: 404 });
  }

  try {
    const quote = await prisma.quote.delete({ where: { id } });
    return Response.json(quote);
  } catch (e) {
    return new Response(`Failed to delete quote: ${e}`, { status: 500 });
  }
}
