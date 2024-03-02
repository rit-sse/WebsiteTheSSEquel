import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

/**
 * check the URL to see what level of authorization is required
 * @param route the API route to check
 * @returns {"None" | "User" | "Member" | "Mentor" | "Officer"}
 */
const routeAuthType = (method: string, route: string) => {
  if (
    // these should only ever be accessible to officers
    route.startsWith("/api/golinks/officer") ||
    // these should only be modified by officers
    ((route.startsWith("/api/hourBlocks") ||
      route.startsWith("/api/departments") ||
      route.startsWith("/api/officer") ||
      route.startsWith("/api/skill") ||
      route.startsWith("/api/user") ||
      route.startsWith("/api/golinks") ||
      route.startsWith("/api/course")) &&
      method != "GET")
  ) {
    return "Officer";
  }
  if (
    // these should only be modified by mentors
    (route.startsWith("/api/schedule") ||
      // route.startsWith("/api/mentorSkill") ||
      route.startsWith("/api/mentor") ||
      route.startsWith("/api/courseTaken")) &&
    method != "GET"
  ) {
    return "Mentor";
  }
  return "None";
};

const accessDenied = (authType: string) => {
  return new NextResponse(`Access Denied; need to be ${authType} to access`, {
    status: 403,
  });
};

export const authMiddleware = async (request: NextRequest) => {
  // console.log("Auth Middleware is running");
  const { pathname } = request.nextUrl;
  const method = request.method;

  // slice out the `Bearer ...`
  const authToken = request.headers.get("Authorization")?.slice(7);
  const authType = routeAuthType(method, pathname);
  console.log(authType);

  if (authType == "None") {
    // console.log("Letting through with no auth");
    return NextResponse.next();
  }

  if (authToken == null) {
    return accessDenied(authType);
  }

  const perm_fetch = await fetch(process.env.NEXTAUTH_URL + "/api/authLevel", {
    body: JSON.stringify({ token: authToken }),
    method: "PUT",
  });
  // console.log(perm_fetch);
  const permissions = await perm_fetch.json();

  if (
    authType == "Mentor" &&
    // check if there is a mentor...
    permissions.isMentor
  ) {
    // console.log("User is a Mentor");
    return NextResponse.next();
  }
  if (
    authType == "Officer" &&
    // Check if there is an officer...
    permissions.isOfficer
  ) {
    // console.log("User is an Officer");
    return NextResponse.next();
  }
  // console.log("Access Denied");
  return accessDenied(authType);
};
