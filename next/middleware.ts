import { NextRequest, NextResponse } from "next/server";
import { golinksMiddleware } from "./lib/middlewares/golinks";
import { authMiddleware } from "./lib/middlewares/authentication";

export async function middleware(request: NextRequest) {
  console.log("Middleware is running on", request.url);
  // Run the authentication middleware logic
  // let response = await authMiddleware(request);
  let response = await authMiddleware(request);
  // If the response is not NextResponse.next(), terminate the middleware chain
  // and return the response. This would occur if the middleware redirects or rewrites.
  if (response.headers.get("x-middleware-next") != "1") {
    return response;
  }
  // Run the golinks middleware logic
  response = await golinksMiddleware(request);
  // If the response is not NextResponse.next(), terminate the middleware chain
  // and return the response. This would occur if the middleware redirects or rewrites.
  if (response.headers.get("x-middleware-next") != "1") {
    return response;
  }
}
