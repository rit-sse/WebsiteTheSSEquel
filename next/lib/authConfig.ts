export function isGoogleAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

export function getSessionCookieName() {
  if (process.env.SESSION_COOKIE_NAME) {
    return process.env.SESSION_COOKIE_NAME;
  }

  return process.env.NEXTAUTH_URL?.startsWith("https://")
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}
