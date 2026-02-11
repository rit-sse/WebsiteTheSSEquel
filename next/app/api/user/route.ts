import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic'

/**
 * HTTP GET request to /api/user/
 * Returns user list with field-level restrictions:
 * - Officers: full user directory fields.
 * - Authenticated non-officers: full fields only for self; limited public fields for others.
 * - Unauthenticated: limited public fields only.
 */
export async function GET() {
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

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      linkedIn: true,
      gitHub: true,
      description: true,
      image: true,
      _count: {
        select: { Memberships: true },
      },
    },
    orderBy: { name: 'asc' }
  });
  
  // Transform with role-based field filtering.
  const usersWithMembershipCount = users.map(user => {
    const isSelf = !!sessionEmail && user.email === sessionEmail;
    const canSeePrivate = isOfficer || isSelf;

    return {
      id: user.id,
      name: user.name,
      email: canSeePrivate ? user.email : undefined,
      linkedIn: canSeePrivate ? user.linkedIn : null,
      gitHub: canSeePrivate ? user.gitHub : null,
      description: canSeePrivate ? user.description : null,
      image: user.image,
      membershipCount: user._count.Memberships,
      isMember: user._count.Memberships >= 1, // Computed for backward compatibility
    };
  });
  
  return Response.json(usersWithMembershipCount);
}

/**
 * User creation is disabled - use the invitation system instead.
 * 
 * Users must be invited via /api/invitations, which sends them an email
 * to sign in with OAuth. This ensures proper Account and Session records
 * are created by NextAuth, avoiding authentication errors.
 * 
 * @see /api/invitations for creating user invitations
 */
export async function POST() {
  return new Response(
    "User creation is disabled. Use the invitation system at /api/invitations instead.",
    { status: 410 } // 410 Gone
  );
}

/**
 * HTTP DELETE request to /api/user
 * @param request { id: number }
 * @returns user object previously at { id }
 */
export async function DELETE(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // verify the id is included
  if (!("id" in body)) {
    return new Response("ID must be included", { status: 422 });
  }
  const id = body.id;

  const userExists = prisma.user.findUnique({ where: { id } });
  if (userExists == null) {
    return new Response(`Couldn't find user ID ${id}`, { status: 404 });
  }

  try {
    await prisma.quote.deleteMany({ where: { user_id: id } });
    await prisma.officer.deleteMany({
      where: { user_id: id },
    });
    await prisma.account.deleteMany({ where: { userId: id } });
    await prisma.session.deleteMany({ where: { userId: id } });
    const mentors = await prisma.mentor.findMany({ where: { user_Id: id } });
    // to delete a user, we must delete their mentor status
    for (const mentor of mentors) {
      // but to delete a mentor, we must delete all of their courses, schedule, and skills
      await prisma.courseTaken.deleteMany({
        where: { mentorId: mentor.id },
      });
      await prisma.schedule.deleteMany({ where: { mentorId: mentor.id } });
      await prisma.mentorSkill.deleteMany({ where: { mentor_Id: mentor.id } });
    }
    await prisma.mentor.deleteMany({ where: { user_Id: id } });
    const user = await prisma.user.delete({ where: { id } });
    return Response.json(user);
  } catch (e) {
    return new Response(`Failed to delete user: ${e}`, { status: 500 });
  }
}

/**
 * Update an existing user
 * HTTP PUT request to /api/user
 * @param request { id: number, name?: string, email?: string, linkedIn?: string, gitHub?: string, description?: string, image?: string }
 * @returns updated user object
 * 
 * Auth: Users can update their own profile. Officers can update any user.
 * 
 * NOTE: Membership is no longer controlled via isMember boolean.
 * Use the Memberships table and /api/memberships endpoints instead.
 */
export async function PUT(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // verify that the id is included in the request
  if (!("id" in body)) {
    return new Response("ID must be included", { status: 422 });
  }
  const id = body.id;

  // Auth check: users can only edit their own profile, officers can edit anyone
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { email: true },
  });

  if (!targetUser) {
    return new Response(`User ${id} not found`, { status: 404 });
  }

  const isOwner = session.user.email === targetUser.email;

  if (!isOwner) {
    // Check if the caller is an officer
    const authToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;
    const callerUser = authToken ? await prisma.user.findFirst({
      where: { session: { some: { sessionToken: authToken } } },
      select: { officers: { where: { is_active: true }, select: { id: true } } },
    }) : null;

    const isOfficer = (callerUser?.officers?.length ?? 0) > 0;
    if (!isOfficer) {
      return new Response("You can only edit your own profile", { status: 403 });
    }
  }

  // only update fields the caller wants to update
  const data: { name?: string; email?: string; description?: string; linkedIn?: string; gitHub?: string; image?: string } = {};
  if ("name" in body) {
    data.name = body.name;
  }
  // Email identity should generally come from OAuth provider.
  // Keep this officer-only to avoid account confusion and impersonation risk.
  if ("email" in body && !isOwner) {
    data.email = body.email;
  }
  if ("description" in body) {
    data.description = body.description;
  }
  if ("linkedIn" in body) {
    data.linkedIn = body.linkedIn;
  }
  if ("gitHub" in body) {
    data.gitHub = body.gitHub;
  }
  if ("image" in body) {
    data.image = body.image;
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { Memberships: true },
        },
      },
    });
    
    // Return with membershipCount
    return Response.json({
      ...user,
      membershipCount: user._count.Memberships,
      isMember: user._count.Memberships >= 1,
    });
  } catch (e) {
    // make sure the selected user exists
    return new Response(`Failed to update user: ${e}`, { status: 500 });
  }
}
