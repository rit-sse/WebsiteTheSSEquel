import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/project/[id]
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
    const user: any = await prisma.project.findUnique({
      where: {
        id,
      },
      select: {
        title: true,
        image: true,
        techStack: true,
        description: true,
        progress: true,
        leaderId: true,
        leader: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    // make sure the selected user exists
    if (user == null) {
      return new Response(`Didn't find User ID ${id}`, { status: 404 });
    }
    user.contact = user.leader.email;
    user.leader = user.leader.name;
    return Response.json(user);
  } catch {
    return new Response("Invalid User ID", { status: 422 });
  }
}
