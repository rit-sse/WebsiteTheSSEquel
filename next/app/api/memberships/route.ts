import { PrismaClient } from "@prisma/client"
import { z } from "zod";

const prisma = new PrismaClient();


const CreateMembershipSchema = z.object({
    userId: z.number().positive(),
    reason: z.string().min(1),
    dateGiven: z.string().datetime(),
})

/**
 * Handles GET requests to the `/api/memberships/` endpoint.
 *
 * Groups memberships by user, counting the number of memberships per user and retrieving
 * the most recent membership date for each user. The results are ordered by membership count
 * (descending) and then by the most recent membership date (descending).
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
    console.log("GET /api/memberships/")
    const grouped = await prisma.memberships.groupBy({
        by: ['userId'],
        _count: {
            userId: true // memberships per user
        },
        _max: {
            dateGiven: true // most recent membership the user got
        },
        orderBy: [
            { _count: { userId: 'desc' } }, // first ordering priority
            { _max:   { dateGiven: 'desc' } } // second ordering priority
        ],
    });

    const userIds = grouped.map(g => g.userId);
    const users = await prisma.user.findMany({
        where: {
            id: {
                in: userIds
            }
        },
        select: {
            id: true,
            name: true,
        }
    });

    const byId = new Map(users.map(u => [u.id, u]))

    const items = grouped.map((g) => ({
        userId: g.userId,
        name: byId.get(g.userId)?.name ?? `User ${g.userId}`,
        membershipCount: g._count.userId,
        lastMembershipAt: g._max.dateGiven,
    }))

    return Response.json(items)

}

export async function POST(request: Request) {
    console.log("POST /api/memberships/")

    let body: any;
    try {
        body = await request.json();
    } catch (err) {
        console.error("Failed to parse JSON:", err);
        return new Response("Invalid JSON Payload", {status: 400});
    }

    if (!("userId" in body && "reason" in body && "dateGiven" in body)) {
        return new Response("Body is missing 'userId', 'reason', or 'dateGiven'.", { status: 400 });
    }

    const input = CreateMembershipSchema.parse(body);
    
    const created = await prisma.memberships.create({
        data: {
            userId: input.userId,
            reason: input.reason,
            dateGiven: input.dateGiven,
        },
        select: {id: true, userId: true, reason: true, dateGiven: true},
    });

    return Response.json(created, { status: 201 });

}