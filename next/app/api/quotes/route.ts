import { getPayloadClient } from "@/lib/payload";
import { getSessionUser, isOfficerRequest } from "@/lib/payloadCms";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function toQuoteResponse(doc: Record<string, any>) {
  return {
    id: Number(doc.id),
    date_added: doc.dateAdded ?? new Date().toISOString(),
    quote: doc.quote ?? "",
    user_id: Number(doc.userId ?? 0),
    author: doc.author ?? "Anonymous",
  };
}

/**
 * HTTP GET request to api/quotes
 * @returns list of quote objects in model
 */
export async function GET() {
  const payload = await getPayloadClient();
  const quotes = await payload.find({
    collection: "quotes",
    sort: "-dateAdded",
    limit: 1000,
  });

  return Response.json(quotes.docs.map((doc) => toQuoteResponse(doc as Record<string, any>)));
}

/**
 * POST request to /api/quotes
 * @param request { dateAdded: Date, quote: string, userId: number, author?: string }
 * @returns quote object that was created
 */
export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 422 });
  }

  const { dateAdded, quote, userId, author } = body;
  if (!dateAdded || !quote || !userId) {
    return Response.json(
      { error: '"dateAdded", "quote", and "userId" are required' },
      { status: 400 }
    );
  }

  try {
    const payload = await getPayloadClient();
    const newQuote = await payload.create({
      collection: "quotes",
      data: {
        dateAdded: new Date(dateAdded).toISOString(),
        quote,
        userId,
        author: author ?? "Anonymous",
      },
    });

    return Response.json(toQuoteResponse(newQuote as Record<string, any>), { status: 201 });
  } catch (e: any) {
    console.error("Error creating quote:", e);
    return new Response(`Failed to create quote: ${e.message}`, { status: 500 });
  }
}


/**
 * PUT request to /api/quotes
 * @param request { id: number, dateAdded?: Date, quote?: string, userId?: number, author?: string }
 * @returns updated quote object
 */
export async function PUT(request: NextRequest) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return new Response("Must be signed in to edit your quotes", {
      status: 403,
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  if (!("id" in body)) {
    return new Response('"id" must be included in request body', {
      status: 400,
    });
  }
  const id = Number(body.id);
  if (!Number.isFinite(id)) {
    return new Response("invalid id value", { status: 404 });
  }

  const data: {
    quote?: string;
    author?: string;
  } = {};

  if ("quote" in body) {
    data.quote = body.quote;
  }

  if ("author" in body) {
    data.author = body.author;
  }

  const payload = await getPayloadClient();
  const existing = (await payload.findByID({
    collection: "quotes",
    id,
  })) as Record<string, any>;

  const isOfficer = await isOfficerRequest(request);
  if (Number(existing.userId) !== currentUser.id && !isOfficer) {
    return new Response("You may only edit your own quotes", { status: 403 });
  }

  const quoteDoc = await payload.update({
    collection: "quotes",
    id,
    data,
  });

  return Response.json(toQuoteResponse(quoteDoc as Record<string, any>));
}

/**
 * DELETE request to /api/quotes
 * @param request { id: number }
 * @returns quote object deleted at { id }
 */
export async function DELETE(request: NextRequest) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return new Response("Must be signed in to edit your quotes", {
      status: 403,
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  if (!("id" in body)) {
    return new Response("id of quote must be included", { status: 422 });
  }

  const id = Number(body.id);
  if (!Number.isFinite(id)) {
    return new Response("Could not find quote ID", { status: 404 });
  }

  const payload = await getPayloadClient();
  const existing = (await payload.findByID({
    collection: "quotes",
    id,
  })) as Record<string, any>;

  const isOfficer = await isOfficerRequest(request);
  if (Number(existing.userId) !== currentUser.id && !isOfficer) {
    return new Response("You may only delete your own quotes", { status: 403 });
  }

  const deleted = await payload.delete({
    collection: "quotes",
    id,
  });

  return Response.json(toQuoteResponse(deleted as Record<string, any>));
}
