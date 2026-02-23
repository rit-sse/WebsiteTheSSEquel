import { NextRequest, NextResponse } from "next/server";
import { isUrlValid } from "../utils";
import { getInternalApiBase } from "@/lib/baseUrl";

const getDestinationUrl = async (request: NextRequest, goUrl: string) => {
  try {
    const baseUrl = getInternalApiBase(request);
    const response = await fetch(baseUrl + "/api/go/" + goUrl);
    if (response.ok) {
      const url = await response.text();
      return url.startsWith("http") ? url : "https://" + url;
    }
    return null;
  } catch (err) {
    console.error("golinks: failed to resolve destination for", goUrl, err);
    return null;
  }
};

/** Middleware to handle golinks.
 * Checks the following:
 *  - if the path starts with "/go/"
 * - if the go link exists in the data store
 * - if the destination is a valid URL
 * - if the destination is a live site
 *
 * If all checks pass, redirects to the destination.
 * Otherwise, returns NextResponse.next() to continue the middleware chain.
 */
export const golinksMiddleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  // Only run golinks middleware logic for paths starting with "/go/"
  if (pathname.startsWith('/go/')) {
    const goLink = pathname.split('/go/')[1];
    const destination = await getDestinationUrl(request, goLink); // this would be replaced with a database lookup
    // If the destination exists and is valid, redirect to it
    if (destination && isUrlValid(destination)) {
      // check if the url is a live site
      return NextResponse.redirect(destination);
    }
  }

  // Signal to continue the middleware chain (see middleware.ts)
  return NextResponse.next();
};
