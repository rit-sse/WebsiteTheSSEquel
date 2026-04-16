/**
 * Shared display-layer helpers for rendering users — canonical source
 * of truth so that the navbar, profile settings, image upload, and any
 * future surface all derive identical strings from the same name.
 */

/**
 * Two-character uppercase initials derived from a display name.
 * - Splits on any run of whitespace (not just a single space).
 * - Strips empty tokens (double spaces, leading/trailing whitespace).
 * - Takes the first character of the first two word tokens.
 * - Returns "?" when the name is missing or empty.
 *
 * Examples:
 *   getInitials("Jakob Langtry")          // "JL"
 *   getInitials("  Jakob   Langtry  ")    // "JL"
 *   getInitials("Ben Bowen")              // "BB"
 *   getInitials("Cher")                   // "C"
 *   getInitials("")                       // "?"
 *   getInitials(null)                     // "?"
 */
export function getInitials(name: string | null | undefined): string {
  const clean = (name ?? "").trim();
  if (!clean) return "?";
  return clean
    .split(/\s+/)
    .map((token) => token[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
