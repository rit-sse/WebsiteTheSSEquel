import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { getPublicBaseUrl } from "@/lib/baseUrl";
import {
  createEmailMembershipAward,
  emailMembershipAwardSchema,
  MembershipAwardError,
  sendMembershipAwardEmail,
} from "@/lib/services/membershipAwardService";
import { z } from "zod";
import { resolveUserImage } from "@/lib/s3Utils";
import {
  MANUAL_MEMBERSHIP_REASONS,
  normalizeMembershipDateInput,
} from "@/lib/membershipUtils";
import { getCurrentSseOperationalTerm } from "@/lib/sseTerms";

const CreateMembershipSchema = z.object({
  userId: z.number().int().positive(),
  reason: z.enum(MANUAL_MEMBERSHIP_REASONS),
  dateGiven: z.string().min(1),
});

/**
 * Handles GET requests to the `/api/memberships/` endpoint.
 *
 * Groups active-term memberships by user, counting the number of memberships
 * per user for the current SSE operational term and retrieving the most recent
 * membership date for each user. Summer is intentionally skipped: after Spring,
 * SSE's next active membership term is Fall.
 *
 * For each grouped user, fetches their name and returns a JSON array of objects containing:
 * - `userId`: The user's ID.
 * - `name`: The user's name (or a fallback if not found).
 * - `membershipCount`: The number of memberships the user has.
 * - `lastMembershipAt`: The date of the most recent membership.
 *
 * @returns {Promise<Response>} A JSON response containing the aggregated membership data per user.
 */
export async function GET() {
  console.log("GET /api/memberships/");
  const activeTerm = getCurrentSseOperationalTerm();
  const grouped = await prisma.memberships.groupBy({
    by: ["userId"],
    where: activeTerm,
    _count: {
      userId: true, // memberships per user
    },
    _max: {
      dateGiven: true, // most recent membership the user got
    },
    orderBy: [
      { _count: { userId: "desc" } }, // first ordering priority
      { _max: { dateGiven: "desc" } }, // second ordering priority
    ],
  });

  const userIds = grouped.map((g: any) => g.userId);
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds,
      },
    },
    select: {
      id: true,
      name: true,
      profileImageKey: true,
      googleImageURL: true,
    },
  });

  const byId = new Map<number, (typeof users)[0]>(
    users.map((u: any) => [u.id, u])
  );
  const items = grouped.map((g: any) => ({
    userId: g.userId,
    name: byId.get(g.userId)?.name ?? `User ${g.userId}`,
    image: resolveUserImage(
      byId.get(g.userId)?.profileImageKey,
      byId.get(g.userId)?.googleImageURL
    ),
    membershipCount: g._count.userId,
    lastMembershipAt: g._max.dateGiven,
  }));

  return Response.json(items);
}

export async function POST(request: Request) {
  const auth = await getGatewayAuthLevel(request);
  if (!auth.userId)
    return new Response("Please sign in first.", { status: 401 });
  if (!auth.isOfficer)
    return new Response("Officer access required.", { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON payload.", { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return new Response("Invalid membership payload.", { status: 400 });
  }

  if ("email" in body) {
    const parsed = emailMembershipAwardSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        "Provide a valid @g.rit.edu email, membership reason, and earned date.",
        { status: 400 }
      );
    }
    try {
      normalizeMembershipDateInput(parsed.data.dateGiven);
    } catch {
      return new Response("Invalid membership date.", { status: 400 });
    }
    try {
      const { award, membership } = await createEmailMembershipAward(
        parsed.data,
        auth.userId
      );
      if (membership) {
        return Response.json(
          { status: "awarded", membership },
          { status: 201 }
        );
      }
      // Retrying a save shouldn't send another email. Resends have their own action.
      const delivery =
        award.emailStatus === "PENDING"
          ? await sendMembershipAwardEmail(
              award.id,
              getPublicBaseUrl(
                new NextRequest(request.url, { headers: request.headers })
              )
            )
          : {
              emailStatus: award.emailStatus,
              message:
                "Award already saved. Check pending memberships for email status.",
            };
      if ("membership" in delivery) {
        return Response.json(
          { status: "awarded", membership: delivery.membership },
          { status: 201 }
        );
      }
      return Response.json(
        { status: "pending", awardId: award.id, ...delivery },
        { status: 201 }
      );
    } catch (error) {
      if (error instanceof MembershipAwardError) {
        return new Response(error.message, { status: error.status });
      }
      console.error("Failed to save membership award", error);
      return new Response(
        "Could not finish saving the award. Retry without closing the form.",
        { status: 500 }
      );
    }
  }

  const parsed = CreateMembershipSchema.safeParse(body);
  if (!parsed.success) {
    return new Response("Invalid membership payload.", { status: 400 });
  }

  let normalizedDateGiven: string;
  try {
    normalizedDateGiven = normalizeMembershipDateInput(parsed.data.dateGiven);
  } catch {
    return new Response("Invalid membership payload.", { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true },
  });
  if (!user) return new Response("Member account not found.", { status: 404 });
  const { term, year } = getCurrentSseOperationalTerm(
    new Date(normalizedDateGiven)
  );
  const created = await prisma.memberships.create({
    data: {
      userId: parsed.data.userId,
      reason: parsed.data.reason,
      dateGiven: normalizedDateGiven,
      term,
      year,
    },
    select: { id: true, userId: true, reason: true, dateGiven: true },
  });
  return Response.json(created, { status: 201 });
}
