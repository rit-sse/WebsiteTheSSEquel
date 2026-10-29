import { AuthLevel } from "@/lib/authLevel";
import { ApiError } from "@/lib/apiError";

export type GatewayAuthLevel = AuthLevel;

const DEFAULT_GATEWAY_AUTH_LEVEL: GatewayAuthLevel = {
  userId: null,
  isUser: false,
  isMember: false,
  membershipCount: 0,
  isMentor: false,
  isOfficer: false,
  isMentoringHead: false,
  isProjectsHead: false,
  isTechCommitteeHead: false,
  isTechCommitteeDivisionManager: false,
  techCommitteeManagedDivision: null,
  isPrimary: false,
  isPrimaryOfficer: false,
  isSeAdmin: false,
};

/**
 * Route-level officer check for handlers that also sit behind the auth
 * middleware. Returns an error response to send, or null when allowed.
 */
export async function requireOfficer(
  request: Request
): Promise<Response | null> {
  const authLevel = await getGatewayAuthLevel(request);
  if (!authLevel.isUser) return ApiError.unauthorized();
  if (!authLevel.isOfficer && !authLevel.isSeAdmin) return ApiError.forbidden();
  return null;
}

export async function getGatewayAuthLevel(
  request: Request
): Promise<GatewayAuthLevel> {
  try {
    const { resolveAuthLevelFromRequest } =
      await import("@/lib/authLevelResolver");
    const data = await resolveAuthLevelFromRequest(request);
    return { ...DEFAULT_GATEWAY_AUTH_LEVEL, ...data };
  } catch {
    return { ...DEFAULT_GATEWAY_AUTH_LEVEL };
  }
}
