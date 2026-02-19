type HeaderCarrier = { headers: Headers };

export const PROXY_EMAIL_HEADER = "x-auth-request-email";
export const PROXY_GROUPS_HEADER = "x-auth-request-groups";
export const PROXY_USER_HEADER = "x-auth-request-user";

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

export function getProxyUsername(source: HeaderCarrier): string | null {
  const value = source.headers.get(PROXY_USER_HEADER)?.trim();
  return value || null;
}

export function hasStagingElevatedAccess(source: HeaderCarrier): boolean {
  return isStagingProxyAuthEnabled();
}
