export const ApiError = {
  validationError: (message: string, details?: unknown) =>
    Response.json({ error: message, details }, { status: 422 }),
  badRequest: (message: string) =>
    Response.json({ error: message }, { status: 400 }),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
  forbidden: () => Response.json({ error: "Forbidden" }, { status: 403 }),
  notFound: (resource = "Resource") =>
    Response.json({ error: `${resource} not found` }, { status: 404 }),
  conflict: (message: string) =>
    Response.json({ error: message }, { status: 409 }),
  internal: () =>
    Response.json({ error: "Internal server error" }, { status: 500 }),
};
