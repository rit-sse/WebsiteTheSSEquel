import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/[id]/profile
 * Returns a user's public profile data including memberships, projects, and officer roles.
 * Email is only included if the requester is viewing their own profile.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return new Response("Invalid User ID", { status: 422 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      linkedIn: true,
      gitHub: true,
      description: true,
      Memberships: {
        select: {
          id: true,
          reason: true,
          dateGiven: true,
        },
        orderBy: { dateGiven: "desc" },
      },
      projectContributions: {
        select: {
          project: {
            select: {
              id: true,
              title: true,
              description: true,
              repoLink: true,
            },
          },
        },
      },
      officers: {
        select: {
          id: true,
          is_active: true,
          start_date: true,
          end_date: true,
          position: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { start_date: "desc" },
      },
    },
  });

  if (!user) {
    return new Response(`User ${id} not found`, { status: 404 });
  }

  // Check if the viewer is the profile owner - if so, include email
  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.email === user.email;

  const projects = user.projectContributions.map((pc) => pc.project);

  return Response.json({
    id: user.id,
    name: user.name,
    email: isOwner ? user.email : undefined,
    image: user.image,
    linkedIn: user.linkedIn,
    gitHub: user.gitHub,
    description: user.description,
    membershipCount: user.Memberships.length,
    memberships: user.Memberships,
    projects,
    officerRoles: user.officers,
    isOwner,
  });
}
