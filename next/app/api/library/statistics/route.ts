import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    console.log("GET /api/library/statistics");
    try {
        const totalBooks = await prisma.textbookCopies.count();
        const checkedOutBooks = await prisma.textbookCopies.count({
            where: {
                checkedOut: true,
            }
        });
        const totalTextbooks = await prisma.textbooks.count();

        return NextResponse.json({
            totalBooks,
            checkedOutBooks,
            totalTextbooks,
        });
    } catch (e: any) {
        console.error("Error fetching statistics:", e);
        return new Response(JSON.stringify({ error: `Failed to fetch statistics: ${e.message}` }), { status: 500 });
    }
}