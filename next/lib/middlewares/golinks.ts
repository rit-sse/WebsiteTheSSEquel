import { NextRequest, NextResponse } from "next/server";
import { isUrlValid } from "../utils";
import prisma from "@/lib/prisma";

const getDestinationUrl = async (goUrl: string) => {
  try {
    const record = await prisma.goLinks.findFirst({ where: { golink: goUrl } });
    if (record?.url) {
      return record.url.startsWith("http") ? record.url : "https://" + record.url;
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
    const destination = await getDestinationUrl(goLink);
    // If the destination exists and is valid, redirect to it
    if (destination && isUrlValid(destination)) {
      // check if the url is a live site
      return NextResponse.redirect(destination);
    }
  }

  // Signal to continue the middleware chain (see middleware.ts)
  return NextResponse.next();
};
