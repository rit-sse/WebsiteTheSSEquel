/**
 * Deterministic per-name color assignment for election avatars. Matches
 * the design handoff's "candidate identity" palette — CTA pink / orange /
 * blue / green plus the brand-blue triptych — so that a given user gets
 * the same candy-colored gradient everywhere they appear on election
 * screens.
 *
 * Derived from `sse-primary-election-system/project/election/data.js`
 * CANDIDATES colors (#ff90e8, #ffb347, #87ceeb, #98fb98, #5289AF, #426E8C).
 */

// Keep the palette small and bright — too many colors and the identity
// signal is lost.
export const ELECTION_AVATAR_PALETTE = [
  "#ff90e8", // cta-pink
  "#ffb347", // cta-orange
  "#87ceeb", // cta-blue
  "#98fb98", // cta-green
  "#5289AF", // sse-mid blue
  "#426E8C", // sse-deep blue
  "#86ACC7", // sse-light blue
] as const;

/**
 * Shade a hex color by `amt` (positive → lighter, negative → darker).
 * Matches the design prototype's `shade()` helper in app.jsx:43.
 */
export function shadeHex(hex: string, amt: number): string {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Pick a stable color for a given identifier (name, user id, email, etc.).
 * Uses a cheap string hash so the same input always maps to the same color.
 */
export function pickElectionAvatarColor(seed: string | number): string {
  const str = typeof seed === "number" ? String(seed) : seed;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return ELECTION_AVATAR_PALETTE[hash % ELECTION_AVATAR_PALETTE.length]!;
}

/**
 * CSS background string for an election avatar — a 135° gradient from the
 * base color to a darker shade, matching app.jsx's Avatar.
 */
export function electionAvatarGradient(seed: string | number): string {
  const color = pickElectionAvatarColor(seed);
  return `linear-gradient(135deg, ${color}, ${shadeHex(color, -18)})`;
}

/**
 * Inline style object ready to spread onto an Avatar / AvatarFallback /
 * pair-avatar element.
 */
export function electionAvatarStyle(seed: string | number): {
  background: string;
  color: string;
} {
  return {
    background: electionAvatarGradient(seed),
    color: "#000",
  };
}
