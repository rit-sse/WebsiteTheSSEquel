import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getAuth, getSessionCookie } from "../authTools";

export async function GET(request: NextRequest) {
    console.log("GET /api/library/categories/");

    try {
        // If "simple" query parameter is true, only return id and categoryName for categories, and only return id and ISBN for books.
        let compressed = request.nextUrl.searchParams.get("simple") === "true";

        let response: { [key: string]: { id: number; categoryName: string; books: any[] } } = {}

        const categories = await prisma.bookCategory.findMany({
            select: {
                id: true,
                categoryName: true,
                books: true,
            },
            orderBy: {
                id: 'asc'
            }
        });

        if (!categories || categories.length === 0) {
            return new Response(JSON.stringify({}), { status: 200 });
        }

        for (const category of categories) {
            let bookCount: { [key: string]: number } = {}

            const books = await prisma.textbooks.findMany({
                where: {
                    id: {
                        in: category.books
                    }
                },
                select: {
                    id: !compressed,
                    ISBN: true,
                    name: !compressed,
                    authors: !compressed,
                    image: !compressed,
                    description: !compressed,
                    publisher: !compressed,
                    edition: !compressed,
                    keyWords: !compressed,
                    classInterest: !compressed,
                    yearPublished: !compressed,
                }
            });

            if (!compressed) {
                for (const book of books as { id: number; ISBN: string }[]) {
                    const stockNumber = await prisma.textbookCopies.count({
                        where: {
                            ISBN: book.ISBN,
                            checkedOut: false,
                        }
                    });
                    bookCount[book.ISBN] = stockNumber;
                }

                for (let i = 0; i < books.length; i++) {
                    (books[i] as any).stockNumber = bookCount[books[i].ISBN] || 0;
                }
                for (const book of books as any[]) {
                    book["stockNumber"] = bookCount[book.ISBN] || 0;
                }
            }

            response[category.categoryName] = {
                id: category.id,
                categoryName: category.categoryName,
                books: books
            };

        }
        return new Response(JSON.stringify(response), { status: 200 });
    } catch (e) {
        console.error("Error fetching categories:", e);
        return new Response(JSON.stringify({ error: "Failed to fetch categories" }), { status: 500 });

    }
}
export async function PUT(request: NextRequest) {
    try {
        const auth = await getAuth(request);
        if (!auth.isMentor && !auth.isOfficer) {
            return new Response("Unauthorized", { status: 401 });
        }

        let body = await request.json();

        let affilaitedISBNs = await prisma.textbooks.findMany({
            where: {
                ISBN: {
                    in: body.books
                }
            },
            select: {
                id: true,
                ISBN: true,
            }
        });

        let affilaitedBooks = affilaitedISBNs.map(book => book.id);

        let updatedCategory = await prisma.bookCategory.update({
            where: {
                id: body.id,
            },
            data: {
                categoryName: body.categoryName,
                books: affilaitedBooks,
            }
        });

        return new Response(JSON.stringify(updatedCategory), { status: 200 });
    } catch (e) {
        console.error("Error updating category:", e);
        return new Response(JSON.stringify({ error: "Failed to update category" }), { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuth(request);
        if (!auth.isMentor && !auth.isOfficer) {
            return new Response("Unauthorized", { status: 401 });
        }

        let body = await request.json();

        let affilaitedISBNs = await prisma.textbooks.findMany({
            where: {
                ISBN: {
                    in: body.books
                }
            },
            select: {
                id: true,
                ISBN: true,
            }
        });

        let affilaitedBooks = affilaitedISBNs.map(book => book.id);

        let newCategory = await prisma.bookCategory.create({
            data: {
                categoryName: body.categoryName,
                books: affilaitedBooks,
            }
        });

        return new Response(JSON.stringify(newCategory), { status: 200 });
    } catch (e) {
        console.error("Error creating category:", e);
        return new Response(JSON.stringify({ error: "Failed to create category" }), { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const auth = await getAuth(request);
        if (!auth.isMentor && !auth.isOfficer) {
            return new Response("Unauthorized", { status: 401 });
        }

        let body = await request.json();

        let deletedCategory = await prisma.bookCategory.delete({
            where: {
                id: body.id,
            }
        });

        return new Response(JSON.stringify(deletedCategory), { status: 200 });
    } catch (e) {
        console.error("Error deleting category:", e);
        return new Response(JSON.stringify({ error: "Failed to delete category" }), { status: 500 });
    }
}
