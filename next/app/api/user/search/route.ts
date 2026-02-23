import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getGatewayAuthLevel } from "@/lib/authGateway";

/**
 * Handles GET requests to search for users by name or email.
 *
 * Extracts the search query from the request URL's `q` parameter, and returns a list of users whose
 * name or email contains the query string (case-insensitive). If the query is empty, returns an empty list.
 *
 * @param req - The incoming HTTP request object.
 * @returns A JSON response containing an array of matching user objects with `id`, `name`, and `email` fields.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email ?? null;

  if (!sessionEmail) {
    return new Response("Unauthorized", { status: 401 });
  }

  const authLevel = await getGatewayAuthLevel(req as Request);
  const isOfficer = authLevel.isOfficer;

  const url = new URL(req.url);
  const query = (url.searchParams.get("q") || "").trim();

  if (!query) {
    return Response.json({ items: [] });
  }

  const items = await prisma.user.findMany({
    where: {
      OR: [
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
    },

    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return Response.json({
    items: items.map((u) => ({
      id: u.id,
      name: u.name,
      email: isOfficer ? u.email : undefined,
    })),
  });
}
