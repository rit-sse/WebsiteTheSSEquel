import { NextResponse } from "next/server";
import { ApiError } from "@/lib/apiError";
import { getCurrentConstitutionDocument } from "@/lib/constitution/document";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const document = await getCurrentConstitutionDocument();
    return NextResponse.json(document);
  } catch (error) {
    console.error("Error fetching constitution document:", error);
    return ApiError.internal();
  }
}
