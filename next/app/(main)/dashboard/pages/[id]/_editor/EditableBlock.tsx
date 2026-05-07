"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { BLOCK_META, type BlockNode } from "@/lib/pageBuilder/blocks";
import { cn } from "@/lib/utils";
import { CanvasBlockBody } from "./CanvasBlockBody";
import { CANVAS_RENDERABLE_BLOCKS } from "./blockClassification";

interface Props {
  block: BlockNode;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (props: BlockNode["props"]) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onAddAfter: () => void;
  isLast: boolean;
  disabled?: boolean;
  /** Server-rendered children for this block when it's a dynamic
   *  block (photo carousel, app widget, etc.). When supplied, the
   *  canvas mounts this in place of the placeholder card. */
  dynamicSlot?: ReactNode;
}

/**
 * EditableBlock — wraps a single block on the canvas with selection,
 * hover affordances, drag-to-reorder, inline-edit dispatch, and an
 * "insert below" slot beneath it.
 */
export function EditableBlock({
  block,
  selected,
  onSelect,
  onUpdate,
  onRemove,
  onDuplicate,
  onAddAfter,
  isLast,
  disabled,
  dynamicSlot,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled });

  const meta = BLOCK_META[block.type];
  const isCanvasRenderable = CANVAS_RENDERABLE_BLOCKS.has(block.type);

  return (
    <div className="group/block relative" ref={setNodeRef} style={{
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.4 : 1,
    }}>
      {/* Selection / hover frame */}
      <div
        className={cn(
          "relative rounded-md transition-[box-shadow,outline] -mx-2 px-2",
          selected
            ? "outline outline-2 outline-foreground/70 -outline-offset-2"
            : "hover:outline hover:outline-1 hover:outline-foreground/25",
        )}
        onClick={(e) => {
          // Click in non-text area selects.
          // Text-content blocks handle their own onActivate to forward
          // selection from inside the inline editor wrapper.
          if (!selected) onSelect();
          if (!isCanvasRenderable) e.stopPropagation();
        }}
      >
        {/* Hover toolbar — top-right */}
        <div
          className={cn(
            "absolute right-1 top-1 z-20 flex items-center gap-0.5 rounded-md border border-border/60 bg-card/95 px-1 py-0.5 text-muted-foreground shadow-sm backdrop-blur",
            "opacity-0 group-hover/block:opacity-100 transition-opacity",
            selected && "opacity-100 border-foreground/40",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            disabled={disabled}
            className="flex cursor-grab items-center px-1 py-0.5 hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-30"
            title="Drag to reorder"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <span className="px-1.5 text-[11px] font-medium text-foreground/70">
            {meta.label}
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={onDuplicate}
            className="rounded p-1 hover:bg-surface-1 hover:text-foreground disabled:opacity-30"
            title="Duplicate"
            aria-label="Duplicate block"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onRemove}
            className="rounded p-1 hover:bg-categorical-pink/20 hover:text-destructive disabled:opacity-30"
            title="Delete"
            aria-label="Delete block"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>

        <CanvasBlockBody
          block={block}
          selected={selected}
          disabled={disabled}
          onUpdate={onUpdate}
          onActivate={onSelect}
          dynamicSlot={dynamicSlot}
        />
      </div>

      {/* Insert slot below this block */}
      <InsertSlot
        onAdd={onAddAfter}
        disabled={disabled}
        emphasized={isLast}
      />
    </div>
  );
}

function InsertSlot({
  onAdd,
  disabled,
  emphasized,
}: {
  onAdd: () => void;
  disabled?: boolean;
  emphasized?: boolean;
}) {
  return (
    <div
      className={cn(
        "group/insert relative flex h-3 items-center justify-center",
        emphasized ? "h-6" : "h-3",
      )}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        className={cn(
          "absolute inset-x-0 top-1/2 mx-auto flex h-5 -translate-y-1/2 items-center justify-center gap-1 rounded-full border border-foreground/40 bg-background px-2 text-[10px] font-medium text-foreground/70 shadow-sm transition-opacity",
          "max-w-[10rem]",
          emphasized
            ? "opacity-100 group-hover/insert:opacity-100"
            : "opacity-0 group-hover/insert:opacity-100",
          disabled && "cursor-not-allowed opacity-30 hover:opacity-30",
        )}
        title="Insert block here"
      >
        <Plus className="h-3 w-3" />
        Insert block
      </button>
      {/* Hairline that hints at the insertion line */}
      <span
        className={cn(
          "h-px w-full bg-foreground/0 transition-colors",
          "group-hover/insert:bg-foreground/30",
        )}
      />
    </div>
  );
}
