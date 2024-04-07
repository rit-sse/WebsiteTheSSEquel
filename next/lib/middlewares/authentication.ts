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
    // get the token from the cookie
    const token = request.cookies.get("next-auth.session-token")?.value;
    // fetch permissions from the API
    const permissions = await fetch(
      process.env.NEXTAUTH_URL + "/api/authLevel",
      {
        body: JSON.stringify({ token }),
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

const accessDenied = (authType: string) => {
  return new NextResponse(`Access Denied; need to be ${authType} to access`, {
    status: 403,
  });
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
  return accessDenied(authType);
};
