/**
 * Stable content hashing for the page builder.
 *
 * The publish route uses this to no-op when the draft is byte-identical
 * to the latest published version, and the editor uses it to drive the
 * "publish" button's disabled state. We canonicalize JSON (sort keys,
 * normalize whitespace) so semantically equal documents produce the
 * same hash regardless of property insertion order.
 */
import { createHash } from "node:crypto";

/** sha256 of a canonical JSON encoding of `value`. Always 64 hex chars. */
export function contentHash(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

/** Stable JSON encoding: object keys sorted, no whitespace. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  const obj = value as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const out: Record<string, unknown> = {};
  for (const k of sortedKeys) out[k] = canonicalize(obj[k]);
  return out;
}
