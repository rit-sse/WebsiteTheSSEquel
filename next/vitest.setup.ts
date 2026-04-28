// Vitest setup file for Next.js API route testing
// Polyfills Web APIs that are available in Next.js runtime but may differ in test runtimes.

if (typeof Response !== "undefined" && !Response.json) {
  (Response as any).json = function (data: any, init?: ResponseInit) {
    const body = JSON.stringify(data);
    const headers = new Headers(init?.headers);
    headers.set("content-type", "application/json");
    return new Response(body, { ...init, headers });
  };
}
