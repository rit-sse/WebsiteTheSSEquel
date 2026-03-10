import prisma from "@/lib/prisma";
import { getSessionToken } from "@/lib/sessionToken";
import { NextRequest } from "next/server";
import { CreateQuoteSchema, UpdateQuoteSchema } from "@/lib/schemas/quote";
import { ApiError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

/**
 * HTTP GET request to api/quotes
 * @returns list of quote objects in model
 */
export async function GET() {
  const quotes = await prisma.quote.findMany({
    select: {
      id: true,
      date_added: true,
      quote: true,
      user_id: true,
      author: true,
    },
  });
  return Response.json(quotes);
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
    return ApiError.validationError("Invalid JSON");
  }

  const parsed = CreateQuoteSchema.safeParse(body);
  if (!parsed.success) return ApiError.validationError("Validation failed", parsed.error.flatten());

  const { dateAdded, quote, userId, author } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return ApiError.notFound("User");
    }

    const newQuote = await prisma.quote.create({
      data: {
        date_added: new Date(dateAdded),
        quote,
        user_id: userId,
        author: author ?? "Anonymous",
      },
    });

    return Response.json(newQuote, { status: 201 });
  } catch (e: any) {
    console.error("Error creating quote:", e);
    return ApiError.internal();
  }
}


/**
 * PUT request to /api/quotes
 * @param request { id: number, dateAdded?: Date, quote?: string, userId?: number, author?: string }
 * @returns updated quote object
 */
export async function PUT(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiError.validationError("Invalid JSON");
  }

  //check if user_id is valid
  const authUser = await prisma.user.findFirst({
    where: {
      id: body.userId,
      session: {
        some: {
          sessionToken: getSessionToken(request),
        },
      },
    },
  });
  if (authUser === null) {
    return ApiError.forbidden();
  }

  const parsed = UpdateQuoteSchema.safeParse(body);
  if (!parsed.success) return ApiError.validationError("Validation failed", parsed.error.flatten());

  const { id, quote, author } = parsed.data;

  try {
    await prisma.user.findUniqueOrThrow({
      where: { id: parsed.data.userId ?? body.userId },
    });
  } catch {
    return ApiError.notFound("User");
  }

  const data: { quote?: string; author?: string } = {};
  if (quote !== undefined) data.quote = quote;
  if (author !== undefined) data.author = author;

  try {
    const updatedQuote = await prisma.quote.update({
      where: { id },
      data,
    });
    return Response.json(updatedQuote);
  } catch (e) {
    return ApiError.internal();
  }
}

/**
 * DELETE request to /api/quotes
 * @param request { id: number }
 * @returns quote object deleted at { id }
 */
export async function DELETE(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return ApiError.validationError("Invalid JSON");
  }

  //check if user_id is valid
  const authUserDel = await prisma.user.findFirst({
    where: {
      id: body.userId,
      session: {
        some: {
          sessionToken: getSessionToken(request),
        },
      },
    },
  });
  if (authUserDel === null) {
    return ApiError.forbidden();
  }

  //verify id is included
  if (!("id" in body)) {
    return ApiError.badRequest("id of quote must be included");
  }

  const id = body.id;
  const quoteExists = await prisma.quote.findUnique({ where: { id } });

  if (!quoteExists) {
    return ApiError.notFound("Quote");
  }

  try {
    const quote = await prisma.quote.delete({ where: { id } });
    return Response.json(quote);
  } catch (e) {
    return ApiError.internal();
  }
}
