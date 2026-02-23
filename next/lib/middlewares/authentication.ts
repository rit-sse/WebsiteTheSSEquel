import { NextRequest, NextResponse } from "next/server";
import { getGatewayAuthLevel } from "@/lib/authGateway";

/**
 * A function to verify if a request should be let through. This function should handle the required authLevel
 * API calls and returns a boolean representing whether or not the request should be allowed through
 */
type AuthVerifier = (request: NextRequest) => Promise<AuthOutput>;

type AuthOutput = { isAllowed: boolean; authType: string };

/**
 * Creates an AuthVerifier that checks a property of the user's permissions. Handles the API call
 * and bearer token automatically
 * @param verifier function that takes the user's permissions and returns
 * a boolean representing whether or not the request should be allowed through and the number
 * @returns an AuthVerifier that checks the relevant permissions for the user
 */
const authVerifierFactory = (
  verifier: (permissions: any) => AuthOutput
): AuthVerifier => {
  return async (request: NextRequest) => {
    const permissions = await getGatewayAuthLevel(request);
    return verifier(permissions);
  };
};

/**
 * A wrapper around another verifier that allows GET requests without verification
 */
const nonGetVerifier = (innerVerifier: AuthVerifier): AuthVerifier => {
  return async (request: NextRequest) => {
    // if it's a GET, just allow it
    if (request.method === "GET") {
      return { isAllowed: true, authType: "None" };
    }
    return innerVerifier(request);
  };
};

/**
 * Auth verifier that makes sure the user is an officer
 */
const officerVerifier = authVerifierFactory((permissions) => {
  return { isAllowed: permissions.isOfficer, authType: "Officer" };
});

/**
 * Auth verifier that makes sure the user is a mentor
 */
const mentorVerifier = authVerifierFactory((permissions) => {
  return { isAllowed: permissions.isMentor, authType: "Mentor" };
});

/**
 * Auth verifier specifically for the golinks route
 */
const goLinkVerifier = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;
  // if it's a GET to a public route, just allow it
  if (
    request.method === "GET" &&
    !pathname.startsWith("/api/golinks/officer")
  ) {
    return { isAllowed: true, authType: "None" };
  }
  // otherwise, run the officer verifier
  return officerVerifier(request);
};

/**
 * Auth verifier for events:
 * - GET remains public
 * - attendance mutation endpoints keep their route-level auth logic
 * - all other non-GET event mutations require officer
 */
const eventVerifier: AuthVerifier = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;
  if (request.method === "GET") {
    return { isAllowed: true, authType: "None" };
  }

  if (/^\/api\/event\/[^/]+\/attendance$/.test(pathname)) {
    return { isAllowed: true, authType: "None" };
  }

  return officerVerifier(request);
};

/**
 * An auth verifier that allows GET requests but makes sure all other requests are made by officers
 */
const nonGetOfficerVerifier = nonGetVerifier(officerVerifier);

/**
 * An auth verifier that allows GET requests but makes sure all other requests are made by mentors
 */
const nonGetMentorVerifier = nonGetVerifier(mentorVerifier);

/**
 * Auth verifier for alumni requests - allows POST (public submissions) but requires officer for GET/PUT/DELETE
 */
const alumniRequestsVerifier: AuthVerifier = async (request: NextRequest) => {
  // Allow POST requests from anyone (public can submit requests)
  if (request.method === "POST") {
    return { isAllowed: true, authType: "None" };
  }
  // All other methods (GET, PUT, DELETE) require officer permissions
  return officerVerifier(request);
};

/**
 * Auth verifier for user routes:
 * - GET is public
 * - PUT is allowed through (route-level checks handle self-edit vs officer-edit)
 * - POST, DELETE require officer
 */
const userVerifier: AuthVerifier = async (request: NextRequest) => {
  if (request.method === "GET" || request.method === "PUT") {
    return { isAllowed: true, authType: "None" };
  }
  return officerVerifier(request);
};

/**
 * Map from API route name to authorization verifier. The verifier should be run against any request that
 * goes through that route.
 * Keys are the second element in the path segment; for example, the path "/api/golinks/officer" would
 * correspond to the key "golinks"
 */
const ROUTES: { [key: string]: AuthVerifier } = {
  alumni: nonGetOfficerVerifier,
  "alumni-requests": alumniRequestsVerifier,
  calendar: nonGetOfficerVerifier,
  course: nonGetOfficerVerifier,
  courseTaken: nonGetMentorVerifier,
  departments: nonGetOfficerVerifier,
  event: eventVerifier,
  golinks: goLinkVerifier,
  hourBlocks: nonGetOfficerVerifier,
  memberships: nonGetOfficerVerifier,
  mentor: nonGetOfficerVerifier,
  mentorSkill: nonGetMentorVerifier,
  officer: nonGetOfficerVerifier,
  "officer-positions": nonGetOfficerVerifier,
  project: nonGetOfficerVerifier,
  projectContributor: nonGetOfficerVerifier,
  purchasing: officerVerifier, // All purchasing routes require officer auth
  quotes: nonGetOfficerVerifier,
  schedule: nonGetMentorVerifier,
  skills: nonGetOfficerVerifier,
  sponsor: nonGetOfficerVerifier,
  user: userVerifier,
  userProject: nonGetOfficerVerifier,
};

const accessDenied = (authType: string, request: NextRequest) => {
  const { pathname } = request.nextUrl;
  return new NextResponse(
    `Access Denied; need to be ${authType} to access ${request.method} ${pathname}`,
    {
    status: 403,
    }
  );
};

export const authMiddleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const [_, apiSegment, pathSegment] = pathname.split("/");
  if (apiSegment != "api") {
    return NextResponse.next();
  }
  const routeAuth = ROUTES[pathSegment];
  if (routeAuth == null) {
    return NextResponse.next();
  }
  const { isAllowed, authType } = await routeAuth(request);
  if (isAllowed) {
    return NextResponse.next();
  }
  return accessDenied(authType, request);
};
