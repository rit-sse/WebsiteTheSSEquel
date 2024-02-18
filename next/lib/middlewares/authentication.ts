import { NextRequest, NextResponse } from "next/server";

/**
 * check the URL to see what level of authorization is required
 * @param route the API route to check
 * @returns {"None" | "User" | "Member" | "Mentor" | "Officer"}
 */
const routeAuthType = (method: string, route: string) => {
  if (
    // these should only ever be accessible to officers
    route.startsWith("/api/golinks/officer/") ||
    // these should only be modified by officers
    ((route.startsWith("/api/hourBlocks/") ||
      route.startsWith("/api/departments/") ||
      route.startsWith("/api/officer/") ||
      route.startsWith("/api/skill/") ||
      route.startsWith("/api/course/")) &&
      method != "GET")
  ) {
    return "Officer";
  }
  if (
    // these should only be modified by mentors
    (route.startsWith("/api/schedule/") ||
      route.startsWith("/api/mentorSkill/") ||
      route.startsWith("/api/mentor/") ||
      route.startsWith("/api/courseTaken/")) &&
    method != "GET"
  ) {
    return "Mentor";
  }
  return "None";
};

export const authMiddleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const method = request.method;

  const headers = request.headers;

  if (routeAuthType(method, pathname) == "None") {
    return NextResponse.next();
  }
};
