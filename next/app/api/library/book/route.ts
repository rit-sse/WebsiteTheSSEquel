import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getAuth, getSessionCookie } from "../authTools";
import { writeFileSync } from "fs";

export async function GET(request: NextRequest) {
    try {
        console.log("GET /api/library/[isbn]");

        // Get query parameters
        let isbn = request.nextUrl.searchParams.get("isbn") || "";
        let id = request.nextUrl.searchParams.get("id") || "";
        let getCount = request.nextUrl.searchParams.get("count") === "true";

        if (isbn || isbn.trim() !== "") {
            // Get book details by ISBN
            const book = await prisma.textbooks.findFirst({
                where: {
                    ISBN: isbn,
                },
                select: {
                    id: true,
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

            // If book not found, return 404
            if (!book) {
                return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
            }

            // If the user requested count information, fetch the stock number and overall count
            if (getCount) {
                // Get the number of copies currently in stock (not checked out)
                const stockNumber = await prisma.textbookCopies.count({
                    where: {
                        ISBN: isbn,
                        checkedOut: false,
                    }
                });

                // Get the total number of copies (both checked out and in stock)
                const overallCount = await prisma.textbookCopies.count({
                    where: {
                        ISBN: isbn,
                    }
                });

                // Combine the book details with the count information in the response
                const response = {
                    ...book,
                    stockNumber: stockNumber,
                    overallCount: overallCount,
                };

                return new Response(JSON.stringify(response), { status: 200 });
            }


            return new Response(JSON.stringify(book), { status: 200 });
        }

        return new Response(JSON.stringify({
            error: "ISBN or ID parameter required"
        }), { status: 404 });
    } catch (e) {
        console.error("Error fetching book:", e);
        return new Response(JSON.stringify({ error: `Failed to fetch book: ${e}` }), { status: 500 });
    }

}

export async function POST(request: NextRequest) {
    console.log("POST /api/library/[isbn]");
    try {
        // Authentication check
        const authToken = await getSessionCookie(request);
        const auth = await getAuth(authToken);
        if (!auth.isOfficer && !auth.isMentor) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const formData = await request.formData();
        const ISBN = formData.get("ISBN") as string;
        const name = formData.get("name") as string;
        const authors = formData.get("authors") as string;
        const description = formData.get("description") as string;
        const publisher = formData.get("publisher") as string;
        const edition = formData.get("edition") as string;
        const keyWords = formData.get("keyWords") as string;
        const classInterest = formData.get("classInterest") as string;
        const yearPublished = formData.get("yearPublished") as string;
        const image = formData.get("image") as File;


        try {
            const newBook = await prisma.textbooks.create({
                data: {
                    "ISBN": ISBN,
                    "name": name,
                    "authors": authors,
                    "image": `/library-assets/${ISBN}.jpg`,
                    "description": description,
                    "publisher": publisher,
                    "edition": edition,
                    "keyWords": keyWords,
                    "classInterest": classInterest,
                    "yearPublished": yearPublished,
                },
            });

            // Save the uploaded image to the public directory with the filename as the ISBN
            writeFileSync(`./public/library-assets/${ISBN}.jpg`, Buffer.from(await image.arrayBuffer()));

            return new Response(JSON.stringify(newBook), { status: 200 });
        } catch (e) {
            console.error("Error creating book:", e);
            return new Response(JSON.stringify({ error: `Failed to create book: ${e}` }), { status: 500 });
        }
    } catch (e) {
        console.error("Error processing request:", e);
        return new Response(JSON.stringify({ error: `Failed to process request: ${e}` }), { status: 500 });
    }
}
export async function PUT(request: NextRequest) {
    console.log("PUT /api/library/[isbn]");
    try {
        // Authentication check
        const authToken = await getSessionCookie(request);
        const authLevel = await getAuth(authToken);
        if (!authLevel.isOfficer && !authLevel.isMentor) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
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
        } catch (e) {
            console.error("Error updating/creating book:", e);
            return new Response(`Failed to update/create book: ${e}`, { status: 500 });
        }
    } catch (e) {
        console.error("Error processing request:", e);
        return new Response(`Failed to process request: ${e}`, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    console.log("DELETE /api/library/[isbn]");
    try {
        // Authentication check
        const authToken = await getSessionCookie(request);
        const authLevel = await getAuth(authToken);
        if (!authLevel.isOfficer && !authLevel.isMentor) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }
        let body;
        try {
            body = await request.json();
        } catch {
            return new Response("Invalid JSON", { status: 422 });
        }

        // Get ISBN from request body
        const { ISBN } = body;

        // If ISBN is not provided, return an error
        if (!ISBN) {
            return new Response('"ISBN" is required', { status: 400 });
        }

        try {
            // Erase all records of the book in textbookCopies and textbooks tables
            await prisma.textbookCopies.deleteMany({
                where: { ISBN: ISBN },
            });
            await prisma.textbooks.delete({
                where: { ISBN: ISBN },
            });


            return new Response(JSON.stringify({ message: "Book deleted successfully" }), { status: 200 });
        } catch (e) {
            console.error("Error deleting book:", e);
            return new Response(JSON.stringify({ error: `Failed to delete book: ${e}` }), { status: 500 });
        }
    } catch (e) {
        console.error("Error processing request:", e);
        return new Response(JSON.stringify({ error: `Failed to process request: ${e}` }), { status: 500 });
    }
}