type HeaderCarrier = { headers: Headers };

export const PROXY_EMAIL_HEADER = "x-auth-request-email";
export const PROXY_GROUPS_HEADER = "x-auth-request-groups";
const REQUIRED_TECH_COMMITTEE_GROUP = "tech-committee";

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true";
}

export function isStagingProxyAuthEnabled(): boolean {
  return parseBoolean(process.env.STAGING_PROXY_AUTH);
}

export function getProxyEmail(source: HeaderCarrier): string | null {
  const value = source.headers.get(PROXY_EMAIL_HEADER)?.trim();
  return value || null;
}

function getProxyGroups(source: HeaderCarrier): string[] {
  const rawGroups = source.headers.get(PROXY_GROUPS_HEADER)?.trim();
  if (!rawGroups) return [];
  return rawGroups
    .split(",")
    .map((group) => group.trim().toLowerCase())
    .filter(Boolean);
}

function isInTechCommitteeGroup(source: HeaderCarrier): boolean {
  return getProxyGroups(source).some((group) => {
    return (
      group.endsWith(`:${REQUIRED_TECH_COMMITTEE_GROUP}`)
    );
  });
}

export function hasStagingElevatedAccess(source: HeaderCarrier): boolean {
  return (
    isStagingProxyAuthEnabled() &&
    !!getProxyEmail(source) &&
    isInTechCommitteeGroup(source)
  );
}
