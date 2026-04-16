/**
 * Client-side helpers for dealing with `fetch` responses from our own
 * API routes. The main job here is to extract an error message from a
 * non-2xx response WITHOUT assuming the body is JSON — middleware and
 * other layers can return plain text on error, and blindly calling
 * `response.json()` throws `Unexpected token ...` in that case.
 */

/**
 * Read the body of an errored `fetch` Response and return the best
 * human-readable message we can find.
 *
 * Tries, in order:
 *   1. JSON body with `{ error: string }` or `{ message: string }`
 *   2. Any plain-text body
 *   3. The passed-in fallback
 *
 * Safe to call on non-ok responses only; consumes the body stream.
 */
export async function parseApiError(
  response: Response,
  fallback = "Request failed"
): Promise<string> {
  let text = "";
  try {
    text = await response.text();
  } catch {
    return fallback;
  }

  if (!text) return fallback;

  // Best-effort JSON parse. Content-Type can lie, so we just try it.
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      if (typeof parsed.error === "string" && parsed.error) return parsed.error;
      if (typeof parsed.message === "string" && parsed.message)
        return parsed.message;
    }
  } catch {
    // Not JSON — fall through to the raw text.
  }

  return text.trim() || fallback;
}
