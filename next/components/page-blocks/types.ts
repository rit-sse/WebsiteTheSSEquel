/**
 * Render-side types for the block registry.
 *
 * These wrappers exist alongside the data-only types in
 * `lib/pageBuilder/blocks.ts` so React isn't a dependency of the
 * block schema. The registry maps a `BlockNode.type` to its render +
 * editor components.
 */
import type { ComponentType } from "react";
import type { BlockNode, BlockType } from "@/lib/pageBuilder/blocks";

export type BlockProps<T extends BlockType> = Extract<BlockNode, { type: T }>["props"];

/** Server- or client-component that renders a published block. */
export interface BlockRenderProps<T extends BlockType> {
  props: BlockProps<T>;
  /** True when rendered in the dashboard's preview iframe. */
  preview?: boolean;
}

/** Editor form for a block's props. */
export interface BlockEditorProps<T extends BlockType> {
  props: BlockProps<T>;
  onChange: (next: BlockProps<T>) => void;
}

export interface BlockRegistryEntry<T extends BlockType> {
  type: T;
  Render: ComponentType<BlockRenderProps<T>>;
  Editor: ComponentType<BlockEditorProps<T>>;
}
