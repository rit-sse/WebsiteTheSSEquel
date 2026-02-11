import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

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
        id: true,
        name: true,
        email: true,
        profileImageKey: true,
        googleImageURL: true,
      },
    });
    // make sure the selected user exists
    if (user == null) {
      return new Response(`Didn't find User ID ${id}`, { status: 404 });
    }
    const session = await getServerSession(authOptions);
    const sessionEmail = session?.user?.email ?? null;

    const isOfficer = sessionEmail
      ? !!(await prisma.user.findFirst({
          where: {
            email: sessionEmail,
            officers: {
              some: { is_active: true },
            },
          },
          select: { id: true },
        }))
      : false;

    const isOwner = !!sessionEmail && sessionEmail === user.email;

    return Response.json({
      id: user.id,
      name: user.name,
      image: user.profileImageKey ?? user.googleImageURL ?? null,
      email: isOwner || isOfficer ? user.email : undefined,
    });
  } catch {
    return new Response("Invalid User ID", { status: 422 });
  }
}
