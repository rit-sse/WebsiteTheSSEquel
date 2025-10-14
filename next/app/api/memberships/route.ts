import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

export async function GET() {

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

    const items = grouped.map((g) => {
        name: byId.get(g.userId)?.name ?? `User ${g.userId}`
        membershipsCount: g._count.userId
        lastMembershipAt: g._max.dateGiven
    })

    return Response.json(items)

}