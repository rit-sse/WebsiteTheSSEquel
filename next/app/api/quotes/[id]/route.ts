import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic'

/**
 * HTTP GET request to api/quotes/[id]
 * @param request
 * @param param1 { params: { id: string } }
 * @returns quote with { id }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const quote = await prisma.quote.findUnique({
      where: {
        id,
      },
      select: {
        date_added: true,
        quote: true,
        user_id: true,
        author: true,
      },
    });
    if (quote == null) {
      return new Response(`Could not find Quote ID ${id}`, { status: 404 });
    }
    return Response.json(quote);
  } catch {
    return new Response("Invalid Quote ID", { status: 422 });
  }
}
