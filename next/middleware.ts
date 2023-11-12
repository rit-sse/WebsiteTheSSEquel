import { NextRequest, NextResponse } from 'next/server';
import { golinksMiddleware } from './lib/middlewares/golinks';

export async function middleware(request: NextRequest) {
    // Run the golinks middleware logic
    let response = await golinksMiddleware(request);
    // If the response is not NextResponse.next(), terminate the middleware chain
    // and return the response. This would occur if the middleware redirects or rewrites.
    if (response != NextResponse.next()) {
        return response;
    }
}