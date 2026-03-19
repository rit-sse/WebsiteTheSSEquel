import { NextRequest, NextResponse } from "next/server";
import { getAuth, getSessionCookie } from "../authTools";

export async function GET(params: NextRequest) {
  try {
    const auth = await getAuth(params);

    if (!auth.isMentor && !auth.isOfficer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let isbn = params.nextUrl.searchParams.get("isbn") || "";

    if (!isbn || isbn.trim() === "") {
      return NextResponse.json({ error: '"isbn" is required' }, { status: 400 });
    }
    let bookData: {
      name: string;
      description: string;
      publisher: string;
      ISBN: string;
      yearPublished: number;
    } = {
      name: "",
      description: "",
      publisher: "",
      ISBN: isbn,
      yearPublished: 0,
    };
    try {
      const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
      if (!res.ok) {
        return NextResponse.json(
          { error: `Failed to fetch book data: ${res.statusText}` },
          { status: 500 }
        );
      }
      let jsonRes = await res.json();
      bookData["name"] =
        (jsonRes.title ?? "") + ": " + (jsonRes.subtitle ?? "");
      bookData["description"] =
        typeof jsonRes["description"] === "string"
          ? jsonRes["description"]
          : (jsonRes["description"]?.["value"] ?? "");
      bookData["publisher"] = Array.isArray(jsonRes["publishers"])
        ? jsonRes["publishers"].join(", ")
        : "";
      const publishedYear = Number.parseInt(
        String(jsonRes.publish_date ?? "").match(/\d{4}/)?.[0] ?? "",
        10
      );
      bookData["yearPublished"] = Number.isFinite(publishedYear)
        ? publishedYear
        : 0;
    } catch (e) {
      console.error("Error fetching external book data:", e);
      return NextResponse.json({ error: "Failed to fetch book data" }, { status: 500 });
    }
    return NextResponse.json(bookData);
  } catch (e) {
    console.error("Error fetching book data:", e);
    return NextResponse.json({ error: "Failed to fetch book data" }, { status: 500 });
  }
}
