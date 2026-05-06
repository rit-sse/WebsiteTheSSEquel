import type { BlockType } from "@/lib/pageBuilder/blocks";

/**
 * Block types that render purely client-side (no async data fetching).
 * The canvas can render these in full visual fidelity. Everything else
 * shows as a labeled placeholder so the editor stays a client component
 * without bundling server-only dependencies.
 */
export const CANVAS_RENDERABLE_BLOCKS = new Set<BlockType>([
  "heading",
  "markdown",
  "image",
  "divider",
  "cta",
  "cardGrid",
  "bulletList",
  "bulletListPair",
]);

/**
 * Block types that render as a placeholder on the canvas. Editors still
 * work via the sidebar — these are dynamic blocks (event feeds, photo
 * carousels, app widgets) whose actual output requires server-side data.
 * The user clicks "Preview" in the top bar to see the full render.
 */
export function isCanvasPlaceholderBlock(type: BlockType): boolean {
  return type !== "section" && !CANVAS_RENDERABLE_BLOCKS.has(type);
}
