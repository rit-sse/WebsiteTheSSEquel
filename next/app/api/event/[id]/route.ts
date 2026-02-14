import { getPayloadClient } from "@/lib/payload";
import { resolveMediaURL } from "@/lib/payloadCms";

/**
 * HTTP GET request to /api/event/[id]
 * @param request
 * @param param1 { params: { id: string } }
 * @returns event with { id }
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = await getPayloadClient();
    const event = await payload.findByID({
      collection: "events",
      id,
      depth: 1,
    });

    if (event == null) {
      return new Response(`Didn't find Event ID ${id}`, { status: 404 });
    }

    const typed = event as Record<string, any>;
    return Response.json({
      id: String(typed.id),
      title: typed.title ?? "",
      description: typed.description ?? "",
      image: resolveMediaURL(typed.image),
      date: typed.date ?? "",
      location: typed.location ?? "",
      attendanceEnabled: Boolean(typed.attendanceEnabled),
      grantsMembership: Boolean(typed.grantsMembership),
    });
  } catch {
    return new Response("Invalid Event ID", { status: 422 });
  }
}
