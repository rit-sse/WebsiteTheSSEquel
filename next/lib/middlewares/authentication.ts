import { NextRequest, NextResponse } from "next/server";

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
    // get the token out of the next auth cookies
    const tok = request.cookies.get("next-auth.session-token");
    // fetch permissions from the API
    const permissions = await fetch(
      process.env.NEXTAUTH_URL + "/api/authLevel",
      {
        body: JSON.stringify({ token: tok?.value }),
        method: "PUT",
      }
    ).then(async (res) => await res.json());
    // console.log(permissions);
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
  // if it's a GET to a public route, just allow it
  if (
    request.method === "GET" &&
    !request.nextUrl.toString().startsWith("/api/golinks/officer")
  ) {
    return { isAllowed: true, authType: "None" };
  }
  // otherwise, run the officer verifier
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
 * Map from API route name to authorization verifier. The verifier should be run against any request that
 * goes through that route.
 * Keys are the second element in the path segment; for example, the path "/api/golinks/officer" would
 * correspond to the key "golinks"
 */
const ROUTES: { [key: string]: AuthVerifier } = {
  course: nonGetOfficerVerifier,
  courseTaken: nonGetMentorVerifier,
  departments: nonGetOfficerVerifier,
  golinks: goLinkVerifier,
  hourBlocks: nonGetOfficerVerifier,
  mentor: nonGetOfficerVerifier,
  mentorSkill: nonGetMentorVerifier,
  officer: nonGetOfficerVerifier,
  quotes: nonGetOfficerVerifier,
  schedule: nonGetMentorVerifier,
  skill: nonGetOfficerVerifier,
  user: nonGetOfficerVerifier,
};

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

export const experimentalAuthMiddleware = async (request: NextRequest) => {
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
  return accessDenied(authType);
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
