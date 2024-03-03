import { NextRequest, NextResponse } from "next/server";
import { isUrlValid } from "../utils";

const getDestinationUrl = async (goUrl: string) => {
  const response = await fetch(process.env.NEXTAUTH_URL + "/api/go/" + goUrl);
  if (response.ok) {
    const url = await response.text();
    return url.startsWith("http") ? url : "https://" + url;
  } else {
    console.log("Error finding golink", await response.text());
    return null;
  }
  // for (let goLink of goLinkData) {
  //     if (goLink.goUrl === goUrl) {
  //         return goLink.url;
  //     }
  // }
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
    console.log("middle ware called!") 
    const { pathname } = request.nextUrl;
    // Only run golinks middleware logic for paths starting with "/go/"
    if (pathname.startsWith('/go/')) {
        const goLink = pathname.split('/go/')[1];
        const destination = await getDestinationUrl(goLink); // this would be replaced with a database lookup

    // If the destination exists and is valid, redirect to it
    if (destination && isUrlValid(destination)) {
      // check if the url is a live site
      const response = await fetch(destination);
      if (response.ok) {
        // redirect to the destination
        return NextResponse.redirect(destination);
      }
    }
  }

  // Signal to continue the middleware chain (see middleware.ts)
  return NextResponse.next();
};
