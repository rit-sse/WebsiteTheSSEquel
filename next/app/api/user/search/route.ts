import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const url = new URL(req.url);
    const query = (url.searchParams.get('q') || "").trim();
    
    if (!query) {
        return Response.json({ items : []})
    }

    const items = await prisma.user.findMany({
        where: {
            OR: [
                {
                name: {
                    contains: query, mode: "insensitive"
                }
            },
            {
                email: {
                    contains: query, mode: "insensitive"
                },
            },
            ]
            
        },

        select: {
            id: true,
            name: true,
            email: true,
        }

    })

    return Response.json({
        items: items.map( u => ({
            id: u.id,
            name: u.name,
            email: u.email,
        }))
    })
}