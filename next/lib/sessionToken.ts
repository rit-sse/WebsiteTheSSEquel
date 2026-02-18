type CookieValue = { value?: string } | undefined

type CookieReadableRequest = {
  cookies: {
    get: (name: string) => CookieValue
  }
}

export function getSessionToken(request: CookieReadableRequest): string | undefined {
  const cookieNames = [
    process.env.SESSION_COOKIE_NAME,
    "__Secure-next-auth.session-token",
    "next-auth.session-token",
  ].filter((name): name is string => !!name)

  for (const cookieName of cookieNames) {
    const value = request.cookies.get(cookieName)?.value
    if (value) return value
  }

  return undefined
}
