import { PrismaClient } from "@prisma/client";
import { getSession } from "next-auth/react";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

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
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
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
    return new Response(`Failed to create quote: ${e.message}`, { status: 500 });
  }
}


/**
 * PUT request to /api/quotes
 * @param request { id: number, dateAdded?: Date, quote?: string, userId?: number, author?: string }
 * @returns updated quote object
 */
export async function PUT(request: Request) {
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
  const id = body.id;
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
 * DELETE request to /api/quotes
 * @param request { id: number }
 * @returns quote object deleted at { id }
 */
export async function DELETE(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  if (!("id" in body)) {
    return new Response("id of quote must be included", { status: 422 });
  }

  const id = body.id;
  const quoteExists = prisma.quote.findUnique({ where: { id } });

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
