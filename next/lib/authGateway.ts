import { AuthLevel } from "@/lib/authLevel";

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
  isPrimary: false,
};

export async function getGatewayAuthLevel(request: Request): Promise<GatewayAuthLevel> {
  try {
    const { resolveAuthLevelFromRequest } = await import("@/lib/authLevelResolver");
    const data = await resolveAuthLevelFromRequest(request);
    return { ...DEFAULT_GATEWAY_AUTH_LEVEL, ...data };
  } catch {
    return { ...DEFAULT_GATEWAY_AUTH_LEVEL };
  }
}
