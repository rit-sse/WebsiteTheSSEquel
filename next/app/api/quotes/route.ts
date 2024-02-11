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
 * PUT request to /api/quote
 * @param request { dateAdded: Date, quote: string, user_id: number, author?: string }
 * @returns updated quote object
 */
export async function PUT(request: Request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return new Response("Invalid JSON", { status: 422 });
    }

    //check if id is in request
    if (!("id" in body || "dateAdded" in body || "quote" in body || "user_id" in body)) {
        return new Response("`id`, `dateAdded`, `quote`, and `user_id` must be included in request body", { status: 400 })
    }
    const id = body.id;
    
    //check if user_id is valid
    try {
        prisma.user.findUniqueOrThrow({
            where: { id: body.user_id}
        });
    } catch {
        return new Response("invalid user_id value", { status: 404 })
    }

    const data: {
        dateAdded: Date;
        quote: string;
        user_id: number;
        author?: string;
    } = {
        dateAdded: new Date(body.dateAdded),
        quote: body.quote,
        user_id: body.userId
    };
    
    if ("author" in body) {
        data.author = body.user_id
    }

    try {
        const quote = await prisma.quote.update({
            where: { id },
            data,
        });
        return Response.json(quote);
    } catch (e) {
        return new Response(`Failed to update quote: ${e}`, { status: 500 });
    }

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