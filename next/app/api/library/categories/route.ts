import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    console.log("GET /api/library/categories/");

    let compressed = request.nextUrl.searchParams.get("compress") === "true";
    
    let response: { [key: string]: { id: number; categoryName: string; books: any[] } } = {}

    const categories =  await prisma.bookCategory.findMany({
        select: {
            id: true,
            categoryName: true,
            books: true,
        },
        orderBy: {
            id: 'asc'
        }
    });
    console.log(categories)

    if (!categories || categories.length === 0) {
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    if (compressed) {
        return new Response(JSON.stringify(categories), { status: 200 });
    }
    else {
        for (const category of categories) {
            let bookCount: { [key: string]: number } = {}

            const books = await prisma.textbooks.findMany({
                where: {
                    id: {
                        in: category.books
                    }
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

            for (const book of books as { id: number; ISBN: string }[]) {
                const stockNumber = await prisma.textbooks.count({
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
            response[category.categoryName] = {
                id: category.id,
                categoryName: category.categoryName,
                books: books
            };
        }
        return new Response(JSON.stringify(response), { status: 200 });
    }
}