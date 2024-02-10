import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

/**
 * HTTP GET request to api/quotes/[id]
 * @param request
 * @param param1 { params: { id: string } }
 * @returns quote with { id }
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        const quote = await prisma.quote.findUnique({
            where: {
                id,
            },
            select: {
                date_added: true,
                quote: true,
                user_id: true,
                user: {
                    // testing purposes only, may remove later
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                author: true
            }
        });
        if (id == null) {
            return new Response(`Could not find Quote ID ${id}`, { status: 404 });
        }
        return Response.json(quote);
    } catch {
        return new Response("Invalid Quote ID", { status: 422 });
    }
}