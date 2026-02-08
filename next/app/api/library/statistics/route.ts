import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    console.log("GET /api/library/statistics");
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
}