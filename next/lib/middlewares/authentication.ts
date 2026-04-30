import { NextRequest, NextResponse } from "next/server";
import { getGatewayAuthLevel } from "@/lib/authGateway";

/**
 * A function to verify if a request should be let through. This function should handle the required authLevel
 * API calls and returns a boolean representing whether or not the request should be allowed through
 */
type AuthVerifier = (request: NextRequest) => Promise<AuthOutput>;

type AuthOutput = { isAllowed: boolean; authType: string };

const publicAuthOutput: AuthOutput = { isAllowed: true, authType: "None" };

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

const allowAllVerifier: AuthVerifier = async () => publicAuthOutput;

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
  return {
    isAllowed: permissions.isOfficer || permissions.isSeAdmin,
    authType: "Officer",
  };
});

/**
 * Auth verifier that makes sure the user is a mentor
 */
const mentorVerifier = authVerifierFactory((permissions) => {
  return {
    isAllowed: permissions.isMentor || permissions.isSeAdmin,
    authType: "Mentor",
  };
});

/**
 * Auth verifier that makes sure the user is either a mentor or an officer
 */
const mentorOrOfficerVerifier = authVerifierFactory((permissions) => {
  return {
    isAllowed:
      permissions.isMentor || permissions.isOfficer || permissions.isSeAdmin,
    authType: "Mentor or Officer",
  };
});

/**
 * Auth verifier that requires a primary officer (e.g. President, VP).
 * Used for sensitive management operations like officer/position CRUD.
 */
const primaryOfficerVerifier = authVerifierFactory((permissions) => {
  return {
    isAllowed: permissions.isPrimary || permissions.isSeAdmin,
    authType: "Primary Officer",
  };
});

/**
 * Auth verifier for mentor-schedule management (create/assign/remove
 * blocks, rename the schedule, etc.). The underlying route handlers all
 * enforce `canManageSchedules()` = `isMentoringHead || isPrimary`, so the
 * middleware gate must match. Gating these routes with a mentor-only
 * verifier used to reject primary officers (e.g. President) who have no
 * Mentor row, with a plain-text 403 that then crashed the client's JSON
 * parse.
 */
const scheduleManagementVerifier = authVerifierFactory((permissions) => {
  return {
    isAllowed: permissions.isMentoringHead || permissions.isPrimary,
    authType: "Mentoring Head or Primary Officer",
  };
});

/**
 * Auth verifier that requires any signed-in user
 */
const signedInVerifier = authVerifierFactory((permissions) => {
  return { isAllowed: permissions.isUser, authType: "Signed-in User" };
});

/**
 * Auth verifier for AWS-backed asset routes:
 * - public GETs for the shared image proxy
 * - public POSTs for alumni-request photo uploads
 * - signed-in users for profile picture upload/update
 * - mentor/officer for library book upload/update
 * - officer for any remaining aws routes
 */
const awsVerifier: AuthVerifier = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;

  if (request.method === "GET" && pathname === "/api/aws/image") {
    return { isAllowed: true, authType: "None" };
  }

  if (
    request.method === "POST" &&
    pathname === "/api/aws/alumni-request-pictures"
  ) {
    return { isAllowed: true, authType: "None" };
  }

  if (pathname === "/api/aws/profilePictures") {
    return signedInVerifier(request);
  }

  if (pathname === "/api/aws/libraryBooks") {
    return mentorOrOfficerVerifier(request);
  }

  return officerVerifier(request);
};

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
 * - attendance mutation endpoints require signed-in user (route handles owner logic)
 * - all other non-GET event mutations require officer
 */
const eventVerifier: AuthVerifier = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;
  if (request.method === "GET") {
    return { isAllowed: true, authType: "None" };
  }

  if (/^\/api\/event\/[^/]+\/attendance$/.test(pathname)) {
    return signedInVerifier(request);
  }

  return officerVerifier(request);
};

/**
 * An auth verifier that allows GET requests but makes sure all other requests are made by officers
 */
const nonGetOfficerVerifier = nonGetVerifier(officerVerifier);

/**
 * Auth verifier for the page builder API:
 * - Public GETs to `/api/pages/by-slug/...` (the catch-all renderer
 *   uses these; preview mode is gated inside the handler).
 * - All other GETs (dashboard list, single page) require officer.
 * - DELETE on `/api/pages/[id]` requires primary officer (soft-delete).
 * - POST to `/api/pages` (create) requires primary officer.
 * - POST to `/api/pages/[id]/restore` requires primary officer.
 * - All other mutations (PUT, publish, unpublish, rollback) require officer.
 *
 * Route handlers re-check auth inside themselves so this middleware
 * acts as a defence-in-depth bouncer rather than the sole gate.
 */
const pageBuilderVerifier: AuthVerifier = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  if (method === "GET") {
    if (pathname.startsWith("/api/pages/by-slug/")) {
      return { isAllowed: true, authType: "None" };
    }
    return officerVerifier(request);
  }

  // Primary-only mutations: create page, delete page, restore archived page.
  if (method === "POST" && pathname === "/api/pages") {
    return primaryOfficerVerifier(request);
  }
  if (method === "DELETE" && /^\/api\/pages\/\d+$/.test(pathname)) {
    return primaryOfficerVerifier(request);
  }
  if (method === "POST" && /^\/api\/pages\/\d+\/restore$/.test(pathname)) {
    return primaryOfficerVerifier(request);
  }

  return officerVerifier(request);
};

/**
 * An auth verifier that allows GET requests but requires primary officer for mutations
 */
const nonGetPrimaryOfficerVerifier = nonGetVerifier(primaryOfficerVerifier);

/**
 * An auth verifier that allows GET requests but makes sure all other requests are made by mentors
 */
const nonGetMentorVerifier = nonGetVerifier(mentorVerifier);

/**
 * An auth verifier that allows GET requests but requires Mentoring Head
 * or Primary Officer for mutations. Matches `canManageSchedules()` in
 * the mentor-schedule route handlers.
 */
const nonGetScheduleManagementVerifier = nonGetVerifier(
  scheduleManagementVerifier
);

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
 * Auth verifier for quotes:
 * - GET is public (anyone can read quotes)
 * - POST requires signed-in user (anyone logged in can submit)
 * - PUT/DELETE pass through to route-level checks (self-edit with officer override)
 */
const quoteVerifier: AuthVerifier = async (request: NextRequest) => {
  if (request.method === "GET") {
    return { isAllowed: true, authType: "None" };
  }
  // POST, PUT, DELETE all require at least a signed-in user.
  // PUT/DELETE route handlers enforce ownership or officer privilege.
  return signedInVerifier(request);
};

/**
 * Auth verifier for mentor applications:
 * - GET passes through (route handles own-application vs manager logic)
 * - POST requires signed-in user (anyone can apply)
 * - PUT/PATCH/DELETE pass through (route enforces owner or mentoringHead/primary)
 */
const mentorApplicationVerifier: AuthVerifier = async (
  request: NextRequest
) => {
  if (request.method === "GET") {
    return { isAllowed: true, authType: "None" };
  }
  // All mutations require at least a signed-in user
  return signedInVerifier(request);
};

/**
 * Auth verifier for Tech Committee applications:
 * - GET passes through (route handles public status, own application, and reviewer list checks)
 * - POST/PUT require signed-in user for applicant submission/edit flows
 */
const techCommitteeApplicationVerifier: AuthVerifier = async (
  request: NextRequest
) => {
  if (request.method === "GET") {
    return { isAllowed: true, authType: "None" };
  }

  return signedInVerifier(request);
};

/**
 * Auth verifier for headcount submission routes:
 * - GET remains officer-only for dashboards/reporting
 * - POST is public so anyone staffing the lab can submit the form
 */
const headcountSubmissionVerifier: AuthVerifier = async (
  request: NextRequest
) => {
  if (request.method === "POST") {
    return { isAllowed: true, authType: "None" };
  }

  return officerVerifier(request);
};

/**
 * Auth verifier for library routes:
 * - public GETs for catalog/search/statistics/category and book lookup routes
 * - copy creation requires any signed-in user
 * - other library management routes require mentor or officer access
 */
const libraryVerifier: AuthVerifier = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;

  if (request.method === "GET") {
    if (
      /^\/api\/library\/(book|books|categories|search|statistics)$/.test(
        pathname
      )
    ) {
      return { isAllowed: true, authType: "None" };
    }

    return mentorOrOfficerVerifier(request);
  }

  if (request.method === "POST" && pathname === "/api/library/copies") {
    return signedInVerifier(request);
  }

  return mentorOrOfficerVerifier(request);
};

/**
 * Auth verifier for invitation routes:
 * - pending/accept/decline are accessible to any signed-in user
 * - all other invitation routes (create, list, delete) require officer
 */
const invitationsVerifier: AuthVerifier = async (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;
  if (
    pathname === "/api/invitations/pending" ||
    pathname === "/api/invitations/accept" ||
    pathname === "/api/invitations/decline"
  ) {
    return signedInVerifier(request);
  }
  return officerVerifier(request);
};

/**
 * Map from API route name to authorization verifier. The verifier should be run against any request that
 * goes through that route.
 * Keys are the second element in the path segment; for example, the path "/api/golinks/officer" would
 * correspond to the key "golinks"
 *
 * IMPORTANT: Every API route directory must have an entry here. Routes without an entry
 * will pass through without any auth check.
 */
const ROUTES: { [key: string]: AuthVerifier } = {
  alumni: nonGetOfficerVerifier,
  "alumni-candidates": officerVerifier,
  "alumni-requests": alumniRequestsVerifier,
  auth: allowAllVerifier,
  authLevel: allowAllVerifier,
  aws: awsVerifier,
  calendar: nonGetOfficerVerifier,
  course: nonGetOfficerVerifier,
  courseTaken: nonGetMentorVerifier,
  departments: nonGetOfficerVerifier,
  email: officerVerifier,
  elections: nonGetVerifier(signedInVerifier),
  event: eventVerifier,
  go: allowAllVerifier,
  golinks: goLinkVerifier,
  handover: nonGetOfficerVerifier,
  "headcount-import": primaryOfficerVerifier,
  "headcount-trends": officerVerifier,
  hourBlocks: nonGetOfficerVerifier,
  invitations: invitationsVerifier,
  library: libraryVerifier,
  memberships: nonGetOfficerVerifier,
  "mentee-headcount": headcountSubmissionVerifier,
  mentor: nonGetOfficerVerifier,
  "mentor-application": mentorApplicationVerifier,
  "mentor-availability": nonGetMentorVerifier,
  "mentor-semester": nonGetOfficerVerifier,
  "mentoring-headcount": headcountSubmissionVerifier,
  mentorSchedule: nonGetScheduleManagementVerifier,
  mentorSkill: nonGetMentorVerifier,
  nav: nonGetPrimaryOfficerVerifier,
  officer: nonGetPrimaryOfficerVerifier,
  "officer-positions": nonGetPrimaryOfficerVerifier,
  pages: pageBuilderVerifier,
  "photo-categories": nonGetOfficerVerifier,
  project: nonGetOfficerVerifier,
  projectContributor: nonGetOfficerVerifier,
  purchasing: officerVerifier, // All purchasing routes require officer auth
  quotes: quoteVerifier,
  schedule: nonGetScheduleManagementVerifier,
  scheduleBlock: nonGetScheduleManagementVerifier,
  skills: nonGetOfficerVerifier,
  sponsor: nonGetOfficerVerifier,
  "swipe-access": officerVerifier,
  "tech-committee-application": techCommitteeApplicationVerifier,
  user: userVerifier,
  userProject: nonGetOfficerVerifier,
  when2meet: signedInVerifier,
};

const accessDenied = (authType: string, request: NextRequest) => {
  const { pathname } = request.nextUrl;
  return NextResponse.json(
    {
      error: `Access Denied; need to be ${authType} to access ${request.method} ${pathname}`,
    },
    { status: 403 }
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
