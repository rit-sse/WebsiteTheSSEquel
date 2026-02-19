type HeaderCarrier = { headers: Headers };

export const PROXY_EMAIL_HEADER = "x-auth-request-email";
export const PROXY_SECRET_HEADER = "x-internal-proxy-auth";

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

export function isTrustedProxyRequest(source: HeaderCarrier): boolean {
  if (!isStagingProxyAuthEnabled()) return false;

  const expectedSecret = process.env.STAGING_PROXY_AUTH_SECRET?.trim();
  if (!expectedSecret) return false;

  const providedSecret = source.headers.get(PROXY_SECRET_HEADER)?.trim();
  return !!providedSecret && providedSecret === expectedSecret;
}

export function hasStagingElevatedAccess(source: HeaderCarrier): boolean {
  return isTrustedProxyRequest(source) && !!getProxyEmail(source);
}
