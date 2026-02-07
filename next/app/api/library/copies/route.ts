import prisma from "@/lib/prisma"
import { NextRequest } from "next/server";
import { getAuth, getSessionCookie } from "../authTools";

export async function GET(request: NextRequest) {
    console.log("GET /api/library/copies");
    let cookie = await getSessionCookie(request);
    let auth = await getAuth(cookie);
    if (!auth.isMentor && !auth.isOfficer) {
        return new Response("Unauthorized", { status: 401 });
    }

    let isbn = request.nextUrl.searchParams.get("isbn") || "";
    let id = request.nextUrl.searchParams.get("id") || "";
    if ((!isbn || isbn.trim() === "") && (!id || id.trim() === "")) {
        return new Response('"isbn" or "id" is required', { status: 400 });
    }

    let whereSelection = {}
    if (isbn && isbn.trim() !== "") {
        whereSelection = { ISBN: isbn };
    } else if (id && id.trim() !== "") {
        whereSelection = { id: parseInt(id) };
    }

    let copies = await prisma.textbookCopies.findMany({
        where: whereSelection,
        select: {
            ISBN: true,
            id: true,
            checkedOut: true,
        }
    });

    return new Response(JSON.stringify(copies), { status: 200 });
}

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

export async function PUT(request: NextRequest) {
    console.log("PUT /api/library/copies");
    const authToken = await getSessionCookie(request);
    const auth = await getAuth(authToken);
    if (!auth.isMentor && !auth.isOfficer) {
        return new Response("Unauthorized", { status: 401 });
    }

    let body = await request.json();

    let updatedCopy = await prisma.textbookCopies.update({
        where: {
            id: body.id,
        },
        data: {
            checkedOut: body.checkedOut,
        }
    });

    return new Response(JSON.stringify(updatedCopy), { status: 200 });
}