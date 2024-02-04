import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * HTTP GET request to api/quotes
 * @returns list of quote objects in model
 */
export async function GET() {
    const quotes = await prisma.quote.findMany({
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
    })
    return Response.json(quotes)
}

/**
 * POST request to /api/quote
 * @param request { dateAdded: Date, quote: string, userId: number, author?: string }
 * @returns quote object that was created
 */

// TODO: Test
export async function POST(request: Request) {
    const body = await request.json()

    if (!("dateAdded" in body && "quote" in body && "userId" in body)) {
        return new Response(
            '"userId", "dateAdded", "quote", must be included in request body',
            { status: 400 }
        );
    }

    const date_added = new Date(body.dateAdded)
    const quote = body.quote
    const user_id = body.userId

    // fill in author key if one was specified by user. Otherwise, leave it anonymous
    let author
    if (body.author) {
        author = body.author
    }

    const create_quote = await prisma.quote.create({
        data: {
            date_added,
            quote,
            user_id,
            author
        }
    });

    return Response.json(create_quote, { status: 201 })
}

/**
 * DELETE request to /api/quote
 * @param request { id: number }
 * @returns quote object that was deleted at { id }
 */

//TODO: Test
export async function DELETE(request: Request) {
    const body = await request.json()

    if (!("id" in body)) {
        return new Response("id of quote must be included", {status: 400})
    }

    const id = body.id
    const quoteExists = prisma.quote.findUnique({where: {id}});
    if (!quoteExists) {
        return new Response("quote does not exist", {status: 404})
    }

    const quote = await prisma.quote.delete({where: { id }})
    return Response.json(quote)
}