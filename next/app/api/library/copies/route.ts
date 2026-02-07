import prisma from "@/lib/prisma"
import { NextRequest } from "next/server";
import { getAuth } from "../authTools";

export async function POST(request: NextRequest) {
    console.log("POST /api/library/copies");
    const authToken = request.cookies.get(process.env.SESSION_COOKIE_NAME!)?.value;
    if (!authToken) {
        return new Response("Unauthorized", { status: 401 });
    }

    let body = await request.json();

    let bookData = await prisma.textbookCopies.create({
        data: {
            ISBN: body.ISBN,
            checkedOut: false,
        }
    });

    return new Response(JSON.stringify(bookData), { status: 200 });
}