import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { resolveUserImage } from "@/lib/s3Utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/[id]/profile
 * Returns a user's public profile data including memberships, projects, and officer roles.
 * Email is only included for the owner or an active officer.
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
      profileImageKey: true,
      googleImageURL: true,
      linkedIn: true,
      gitHub: true,
      description: true,
      graduationTerm: true,
      graduationYear: true,
      major: true,
      coopSummary: true,
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
          position_id: true,
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

  // Public profile route: anyone can view profile fields.
  // Email remains private unless owner or active officer.
  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.email === user.email;
  const isOfficer = session?.user?.email
    ? await prisma.user.findFirst({
        where: {
          email: session.user.email,
          officers: {
            some: {
              is_active: true,
            },
          },
        },
        select: { id: true },
      })
    : null;

  const projects = user.projectContributions.map((pc) => pc.project);

  return Response.json({
    id: user.id,
    name: user.name,
    email: isOwner || !!isOfficer ? user.email : undefined,
    image: resolveUserImage(user.profileImageKey, user.googleImageURL),
    profileImageKey: user.profileImageKey ?? null,
    linkedIn: user.linkedIn,
    gitHub: user.gitHub,
    description: user.description,
    graduationTerm: user.graduationTerm,
    graduationYear: user.graduationYear,
    major: user.major,
    coopSummary: user.coopSummary,
    membershipCount: user.Memberships.length,
    memberships: user.Memberships,
    projects,
    officerRoles: user.officers,
    isOwner: !!isOwner,
  });
}
