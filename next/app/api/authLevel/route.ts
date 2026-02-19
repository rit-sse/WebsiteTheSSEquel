import { NextRequest } from "next/server";
import { hasStagingElevatedAccess } from "@/lib/proxyAuth";
import { resolveAuthLevelFromRequest, resolveAuthLevelFromToken } from "@/lib/authLevelResolver";

export const dynamic = 'force-dynamic'

/**
 * Handles a PUT request to update or retrieve authorization level details for a user.
 * Processes the incoming request, validates the JSON body, and determines the user's
 * authorization level based on the provided token.
 *
 * @param {Request} request - The HTTP request object containing the details of the PUT request.
 * @return {Promise<Response>} A Promise resolving to an HTTP Response object containing the
 *                             authorization level or an error message if the JSON body is invalid.
 */
export async function PUT(request: Request): Promise<Response> {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }
  const authLevel = await resolveAuthLevelFromToken(body.token ?? null, {
    stagingElevated: hasStagingElevatedAccess(request),
  });
  return Response.json(authLevel);
}

/**
 * HTTP GET request to /api/authLevel/
 */
export async function GET(request: NextRequest) {
  const authLevel = await resolveAuthLevelFromRequest(request, {
    includeProfileComplete: true,
  });
  return Response.json(authLevel);
}
