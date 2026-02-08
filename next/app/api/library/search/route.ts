import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
export async function GET(request: NextRequest) {
    console.log("GET /api/library/search");
    let query = request.nextUrl.searchParams.get("query") || "";
    if (!query || query.trim() === "") {
        return new Response('"query" is required', { status: 400 });
    }

    let results = await prisma.textbooks.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: "insensitive" } },
                { authors: { contains: query, mode: "insensitive" } },
                { publisher: { contains: query, mode: "insensitive" } },
                { keyWords: { contains: query, mode: "insensitive" } },
                { ISBN: { contains: query, mode: "insensitive" } },
                { classInterest: { contains: query, mode: "insensitive" } },
            ]
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

    return new Response(JSON.stringify(results), { status: 200 });
}