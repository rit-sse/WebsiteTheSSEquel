import prisma from "@/lib/prisma";

export async function GET(request: Request ) {
    console.log("GET /api/library/[isbn]");


    const book = await prisma.textbooks.findMany({
        select: {
            ISBN: true,
            name: true,
            authors: true,
            image: true,
            description: true,
            publisher: true,
            edition: true,
            keyWords: true,
            classInterest: true,
            yearPublished: true,
        }
    });

    if (!book || book.length === 0) {
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(book), { status: 200 });
}