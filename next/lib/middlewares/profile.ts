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
    
    if (pathname.startsWith("/profile")) {
        // const { req, res } = context;
        const sessionToken = request.cookies.get('session');
        if (!sessionToken) {
            // redirect to home if not authorized
            return NextResponse.redirect(new URL('/', request.url));
        }

        // continue if yes authorized
        return NextResponse.next();
    }
        
    // // Signal to continue the middleware chain for all other routes (see middleware.ts)
    return NextResponse.next();
}