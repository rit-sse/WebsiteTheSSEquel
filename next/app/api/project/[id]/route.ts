import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/user/[id]
 * @param request
 * @param param1 { params: { id: string } }
 * @returns user with { id }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // make sure the provided ID is a valid integer
  try {
    const id = parseInt(params.id);
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        name: true,
        email: true,
      },
    });
    // make sure the selected user exists
    if (user == null) {
      return new Response(`Didn't find User ID ${id}`, { status: 404 });
    }
    return Response.json(user);
  } catch {
    return new Response("Invalid User ID", { status: 422 });
  }
}
