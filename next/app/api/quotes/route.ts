import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
    const quotes = await prisma.quote.findMany({
        select: {
            date_added: true,
            quote: true,
            user: {
                select: {
                    firstName: true,
                    lastName: true
                }
            },
            author: true
        }
    })
    console.log(quotes)
    return Response.json(quotes)
}