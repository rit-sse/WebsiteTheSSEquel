import { getPayloadClient } from "@/lib/payload";

export const dynamic = 'force-dynamic'

/**
 * HTTP GET request to api/quotes/[id]
 * @param request
 * @param param1 { params: { id: string } }
 * @returns quote with { id }
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (!Number.isFinite(id)) {
      return new Response("Invalid Quote ID", { status: 422 });
    }

    const payload = await getPayloadClient();
    const quote = await payload.findByID({
      collection: "quotes",
      id,
    });

    if (quote == null) {
      return new Response(`Could not find Quote ID ${id}`, { status: 404 });
    }

    const typed = quote as Record<string, any>;
    return Response.json({
      date_added: typed.dateAdded ?? new Date().toISOString(),
      quote: typed.quote ?? "",
      user_id: Number(typed.userId ?? 0),
      author: typed.author ?? "Anonymous",
    });
  } catch {
    return new Response("Invalid Quote ID", { status: 422 });
  }
}
