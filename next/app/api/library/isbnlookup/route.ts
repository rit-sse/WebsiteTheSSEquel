import { NextRequest } from "next/server";
import { getAuth, getSessionCookie } from "../authTools";

export async function GET(params: NextRequest) {
    try {
    const cookie = await getSessionCookie(params);
    const auth = await getAuth(cookie);

    if (!auth.isMentor && !auth.isOfficer) {
        return new Response("Unauthorized", { status: 401 });
    }

    let isbn = params.nextUrl.searchParams.get("isbn") || "";

    if (!isbn || isbn.trim() === "") {
        return new Response('"isbn" is required', { status: 400 });
    }
    let bookData: {name: string, description: string, publisher: string, ISBN: string, yearPublished: number} = {
        name: "",
        description: "",
        publisher: "",
        ISBN: isbn,
        yearPublished: 0,
    };
    try {
        const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
        if (!res.ok) {
            return new Response(`Failed to fetch book data: ${res.statusText}`, { status: 500 });
        }
        let jsonRes = await res.json();
        bookData["name"] = (jsonRes.title ?? "") + ": " + (jsonRes.subtitle ?? "");
        bookData["description"] = jsonRes["description"]?.["value"] ?? ""
        bookData["publisher"] = jsonRes["publishers"].join(", ") ?? ""
        bookData["yearPublished"] =  (new Date(jsonRes.publish_date).getFullYear()) ?? 0;
    } catch (e) {
        return new Response(JSON.stringify({"error": e}), { status: 500 });
    }
    return new Response(JSON.stringify(bookData), { status: 200 });
    } catch (e: any) {
        console.error("Error fetching book data:", e);
        return new Response(JSON.stringify({ error: `Failed to fetch book data: ${e.message}` }), { status: 500 });
    }
}