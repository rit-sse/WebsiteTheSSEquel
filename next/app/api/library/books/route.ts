import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    console.log("GET /api/library/[isbn]");

    try {
        let isbn = request.nextUrl.searchParams.get("isbn") || "";
        let id = request.nextUrl.searchParams.get("id") || "";
        let simple = request.nextUrl.searchParams.get("simple") === "true"; // If true, only return ISBN and id for copies, and do not return id for book details.

        if (isbn && isbn.trim() !== "") {
            
            const book = await prisma.textbookCopies.findMany({
                where: {
                    ISBN: isbn,
                },
                select: {
                    ISBN: !simple,
                    id: simple,
                    checkedOut: true
                }
            });

            return new Response(JSON.stringify(book), { status: 200 });
        }

        if (id && id.trim() !== "") {
            const book = await prisma.textbooks.findFirst({
                where: {
                    id: parseInt(id),
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
    } catch (e) {
        console.error("Error fetching book:", e);
        return new Response(JSON.stringify({ error: `Failed to fetch book` }), { status: 500 });
    }
}