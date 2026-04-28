import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Officer position image uploads are deprecated. Leadership cards now use assigned user profile images.",
    },
    { status: 410 }
  );
}
