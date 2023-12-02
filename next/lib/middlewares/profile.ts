import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../authOptions";

/** Middleware to handle profile access.
 * Checks the following:
 *  - if the path starts with "/profile"
 * 
 * If user is not logged in, redirect to the home page.
 * Otherwise, returns NextResponse.next() to continue the middleware chain.
 */
export const profileMiddleware = async (request: NextRequest) => {
    const { pathname } = request.nextUrl;
    
    if (pathname && typeof pathname == "string") {
        if (pathname.startsWith("/profile")) {
            let session = await getServerSession(authOptions);
        //     if (!session) {
        //         return NextResponse.redirect(new URL('/', request.url));
        //     }
            return NextResponse.next();
        }
    }
        
    // Signal to continue the middleware chain (see middleware.ts)
    return NextResponse.next();
}