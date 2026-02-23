import { NextRequest, NextResponse } from "next/server";
import { golinksMiddleware } from "./lib/middlewares/golinks";
import { authMiddleware } from "./lib/middlewares/authentication";

export async function proxy(request: NextRequest) {
  let response = await authMiddleware(request);
  if (response.headers.get("x-middleware-next") != "1") {
    return response;
  }

  response = await golinksMiddleware(request);
  if (response.headers.get("x-middleware-next") != "1") {
    return response;
  }

  return NextResponse.next();
}
