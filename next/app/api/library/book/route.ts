import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getAuth } from "../authTools";

export async function GET(request: NextRequest) {
    console.log("GET /api/library/[isbn]");

    let isbn = request.nextUrl.searchParams.get("isbn") || "";
    let id = request.nextUrl.searchParams.get("id") || "";
    let getCount = request.nextUrl.searchParams.get("count") === "true";

    if (isbn || isbn.trim() !== "") {
        const book = await prisma.textbooks.findFirst({
            where: {
                ISBN: isbn,
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

        if (getCount) {
            const stockNumber = await prisma.textbookCopies.count({
                where: {
                    ISBN: isbn,
                    checkedOut: false,
                }
            });

            const response = {
                ...book,
                stockNumber: stockNumber
            };

            return new Response(JSON.stringify(response), { status: 200 });
        }

        if (!book) {
            return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
        }

        return new Response(JSON.stringify(book), { status: 200 });
    }

    return new Response(JSON.stringify({
        error: "ISBN or ID parameter required"
    }), { status: 404 });

}

export async function PUT(request: NextRequest) {
    console.log("PUT /api/library/[isbn]");
    const authToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;
    const authLevel = await getAuth(authToken || null);
    console.log(authLevel);
    if (!authLevel.isOfficer && !authLevel.isMentor) {
        return new Response("Unauthorized", { status: 401 });
    }
    let body;
    try {
        body = await request.json();
    } catch {
        return new Response("Invalid JSON", { status: 422 });
    }

    const { ISBN, name, authors, image, description, publisher, edition, keyWords, classInterest, yearPublished } = body;

    if (!ISBN || !name || !authors) {
        return new Response('"ISBN", "name", and "authors" are required', { status: 400 });
    }

    try {
        const updatedBook = await prisma.textbooks.upsert({
            where: { ISBN: ISBN },
            update: {
                name,
                authors,
                image,
                description,
                publisher,
                edition,
                keyWords,
                classInterest,
                yearPublished,
            },
            create: {
                ISBN,
                name,
                authors,
                image,
                description,
                publisher,
                edition,
                keyWords,
                classInterest,
                yearPublished,
            },
        });

        return new Response(JSON.stringify(updatedBook), { status: 200 });
    } catch (e: any) {
        console.error("Error updating/creating book:", e);
        return new Response(`Failed to update/create book: ${e.message}`, { status: 500 });
    }
}