import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();

export async function GET() {

    const grouped = await prisma.memberships.groupBy({
        by: ['userId'],
        _count: {
            _all: true // memberships per user
        },
        _max: {
            dateGiven: true // most recent membership the user got
        },

        orderBy: {
            userId: 'desc'
        }
    });

    const userIds = grouped.map( g => g.userId);
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

    const items = grouped.map((g, i) => {
        rank: i + 1
        name: byId.get(g.userId)?.name
        membershipsCount: g._count._all
        lastMembershipAt: g._max.dateGiven
    })

    return Response.json(items)

}