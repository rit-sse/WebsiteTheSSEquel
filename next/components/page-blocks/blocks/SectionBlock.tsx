import type { BlockRenderProps } from "../types";

/**
 * Sections are interpreted by PageRenderer as layout boundaries, so the
 * marker block itself does not render standalone content.
 */
export function SectionBlock(_props: BlockRenderProps<"section">) {
  return null;
}
