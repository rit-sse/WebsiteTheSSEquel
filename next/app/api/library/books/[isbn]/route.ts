import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { isbn?: string } }) {
    console.log("GET /api/library/books/[isbn]");

    if(params.isbn == undefined || params.isbn.trim() === "") {
        return new Response(JSON.stringify({ error: "ISBN is required" }), { status: 400 });
    }

    const book = await prisma.textbooks.findFirst({
        where: {
            ISBN: params.isbn,
        },
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

    if (!book) {
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(book), { status: 200 });
}