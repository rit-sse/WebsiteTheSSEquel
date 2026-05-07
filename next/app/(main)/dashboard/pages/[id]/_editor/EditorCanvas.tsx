"use client";

/**
 * EditorCanvas — the live-preview surface of the page editor.
 *
 * Replays the same `groupIntoSections` + `SectionShell` logic as
 * `PageRenderer`, but renders each block via `EditableBlock` so it
 * can be selected, hovered, dragged, and (for text blocks) edited
 * inline. Async / dynamic blocks (photo carousels, app widgets, etc.)
 * render as compact placeholders — clicking them still opens the
 * block-properties tab in the sidebar.
 */
import { useMemo, type ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Layers, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { NeoCard } from "@/components/ui/neo-card";
import { cn } from "@/lib/utils";
import type {
  BlockNode,
  PageContent,
  SectionProps,
} from "@/lib/pageBuilder/blocks";
import { EditableBlock } from "./EditableBlock";

type SectionBlockNode = Extract<BlockNode, { type: "section" }>;

interface Props {
  content: PageContent;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onChange: (next: PageContent) => void;
  onAddBlockAt: (afterId: string | null) => void;
  viewport: "desktop" | "tablet" | "mobile";
  disabled?: boolean;
  /** Server-rendered children for dynamic blocks. */
  dynamicSlots?: Record<string, ReactNode>;
}

const VIEWPORT_CLASS: Record<Props["viewport"], string> = {
  desktop: "max-w-none",
  tablet: "max-w-3xl mx-auto",
  mobile: "max-w-sm mx-auto",
};

export function EditorCanvas({
  content,
  selected,
  onSelect,
  onChange,
  onAddBlockAt,
  viewport,
  disabled,
  dynamicSlots,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sections = useMemo(
    () => groupIntoSections(content.blocks),
    [content.blocks],
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = content.blocks.findIndex((b) => b.id === active.id);
    const newIndex = content.blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange({
      ...content,
      blocks: arrayMove(content.blocks, oldIndex, newIndex),
    });
  }

  function updateBlock(id: string, props: BlockNode["props"]) {
    onChange({
      ...content,
      blocks: content.blocks.map((b) =>
        b.id === id ? ({ ...b, props } as BlockNode) : b,
      ),
    });
  }

  function removeBlock(id: string) {
    const idx = content.blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const blocks = content.blocks.filter((b) => b.id !== id);
    onChange({ ...content, blocks });
    if (selected === id) {
      onSelect(blocks[Math.min(idx, blocks.length - 1)]?.id ?? null);
    }
  }

  function duplicateBlock(id: string) {
    const block = content.blocks.find((b) => b.id === id);
    if (!block) return;
    const clone = { ...block, id: crypto.randomUUID() };
    const blocks = [...content.blocks];
    const idx = blocks.findIndex((b) => b.id === id);
    blocks.splice(idx + 1, 0, clone);
    onChange({ ...content, blocks });
    onSelect(clone.id);
  }

  if (content.blocks.length === 0) {
    return (
      <div
        className={cn(
          "mx-auto flex h-full min-h-[24rem] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border/60 bg-card/40 p-12 text-center",
          VIEWPORT_CLASS[viewport],
        )}
      >
        <p className="font-display text-lg font-semibold tracking-tight">
          Empty page
        </p>
        <p className="text-sm text-muted-foreground">
          Add a block to start building.
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAddBlockAt(null)}
          className="mt-2 rounded-md border-2 border-foreground bg-foreground px-3 py-1.5 text-sm font-semibold text-background transition-transform hover:translate-y-[-1px]"
        >
          + Add your first block
        </button>
      </div>
    );
  }

  const allBlockIds = content.blocks.map((b) => b.id);

  return (
    <div
      className={cn(
        "transition-[max-width] duration-200",
        VIEWPORT_CLASS[viewport],
      )}
      onClick={(e) => {
        // Click on the bare canvas (not on a block) deselects.
        if (e.target === e.currentTarget) onSelect(null);
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={allBlockIds}
          strategy={verticalListSortingStrategy}
        >
          <article className="flex w-full flex-col gap-6 px-3 pb-12 pt-3 md:gap-8 md:px-6 md:pb-16 md:pt-4">
            {sections.map((sec) => (
              <CanvasSection
                key={sec.key}
                sectionBlock={sec.sectionBlock}
                props={sec.props}
                blocks={sec.blocks}
                selected={selected}
                onSelect={onSelect}
                onUpdate={updateBlock}
                onRemove={removeBlock}
                onDuplicate={duplicateBlock}
                onAddAfter={onAddBlockAt}
                disabled={disabled}
                dynamicSlots={dynamicSlots}
              />
            ))}
          </article>
        </SortableContext>
      </DndContext>
    </div>
  );
}

interface SectionGroup {
  key: string;
  /** The section block that opened this group, if any. `null` for the
   *  implicit pre-first-section group. Selecting the wrapper selects
   *  this block. */
  sectionBlock: SectionBlockNode | null;
  props: SectionProps;
  blocks: BlockNode[];
}

function groupIntoSections(blocks: BlockNode[]): SectionGroup[] {
  const groups: SectionGroup[] = [];
  let current: SectionGroup = {
    key: "implicit-section",
    sectionBlock: null,
    props: DEFAULT_SECTION_PROPS,
    blocks: [],
  };
  for (const block of blocks) {
    if (block.type === "section") {
      if (current.blocks.length > 0 || groups.length === 0) {
        groups.push(current);
      }
      current = {
        key: block.id,
        sectionBlock: block,
        props: { ...DEFAULT_SECTION_PROPS, ...block.props },
        blocks: [],
      };
      continue;
    }
    current.blocks.push(block);
  }
  if (current.blocks.length > 0 || groups.length === 0) {
    groups.push(current);
  }
  return groups.filter(
    (g) => g.blocks.length > 0 || g.key !== "implicit-section",
  );
}

const DEFAULT_SECTION_PROPS: SectionProps = {
  label: "Page content",
  width: "wide",
  depth: "none",
  padding: "normal",
  background: "transparent",
  layout: "stack",
  gap: "normal",
  revealOnScroll: false,
  frame: "card",
};

function CanvasSection({
  sectionBlock,
  props,
  blocks,
  selected,
  onSelect,
  onUpdate,
  onRemove,
  onDuplicate,
  onAddAfter,
  disabled,
  dynamicSlots,
}: {
  sectionBlock: SectionBlockNode | null;
  props: SectionProps;
  blocks: BlockNode[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, props: BlockNode["props"]) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAddAfter: (afterId: string | null) => void;
  disabled?: boolean;
  dynamicSlots?: Record<string, ReactNode>;
}) {
  const sectionSelected =
    sectionBlock != null && sectionBlock.id === selected;

  const childrenContent = (
    <>
      {blocks.map((block, i) => (
        <EditableBlock
          key={block.id}
          block={block}
          selected={block.id === selected}
          onSelect={() => onSelect(block.id)}
          onUpdate={(p) => onUpdate(block.id, p)}
          onRemove={() => onRemove(block.id)}
          onDuplicate={() => onDuplicate(block.id)}
          onAddAfter={() => onAddAfter(block.id)}
          isLast={i === blocks.length - 1}
          disabled={disabled}
          dynamicSlot={dynamicSlots?.[block.id]}
        />
      ))}
      {blocks.length === 0 && (
        <div className="rounded-md border border-dashed border-border/40 p-6 text-sm text-muted-foreground">
          Empty section. Add a block via the outline or Add menu.
        </div>
      )}
    </>
  );

  const layoutContent = (
    <div
      className={cn(
        "w-full",
        LAYOUT_CLASS[props.layout],
        GAP_CLASS[props.gap],
        props.layout !== "stack" && "items-start",
        props.layout !== "stack" && "[&>*]:my-0",
      )}
    >
      {childrenContent}
    </div>
  );

  const frame =
    props.depth === "none" ? (
      <div
        className={cn(
          BACKGROUND_CLASS[props.background],
          PADDING_CLASS[props.padding],
        )}
      >
        {layoutContent}
      </div>
    ) : props.frame === "neoCard" ? (
      <NeoCard
        className={cn(
          BACKGROUND_CLASS[props.background],
          PADDING_CLASS[props.padding],
        )}
      >
        {layoutContent}
      </NeoCard>
    ) : (
      <Card
        depth={Number(props.depth) as 1 | 2 | 3}
        className={cn(
          BACKGROUND_CLASS[props.background],
          PADDING_CLASS[props.padding],
        )}
      >
        {layoutContent}
      </Card>
    );

  return (
    <section
      className={cn(
        "relative mx-auto flex w-full flex-col",
        WIDTH_CLASS[props.width],
      )}
    >
      {sectionBlock ? (
        <SectionHeader
          block={sectionBlock}
          props={props}
          selected={sectionSelected}
          onSelect={() => onSelect(sectionBlock.id)}
          onRemove={() => onRemove(sectionBlock.id)}
          disabled={disabled}
        />
      ) : (
        <ImplicitSectionHint />
      )}
      <div
        className={cn(
          "transition-[box-shadow]",
          sectionSelected &&
            "rounded-md ring-2 ring-foreground/40 ring-offset-2 ring-offset-background",
        )}
      >
        {frame}
      </div>
    </section>
  );
}

/**
 * Shown above blocks that aren't enclosed in any explicit Section block —
 * a small hint telling the user they can wrap them in one for layout
 * control. (The implicit section uses sensible defaults, but is not
 * editable.)
 */
function ImplicitSectionHint() {
  return (
    <div className="mb-2 flex items-center gap-2 px-2 text-[11px] text-muted-foreground/60">
      <Layers className="size-3" />
      <span>No section · using page defaults</span>
    </div>
  );
}

/**
 * SectionHeader — the always-visible chrome above each canvas section.
 *
 * Sections are layout boundaries, not content. They control the
 * width / padding / depth / background of the blocks below them. Without
 * a visible affordance the editor user can't see, select, or rearrange
 * them. The header is a thin chip-row with the section label, a compact
 * inline summary of its properties, and drag / delete actions on hover.
 */
function SectionHeader({
  block,
  props,
  selected,
  onSelect,
  onRemove,
  disabled,
}: {
  block: SectionBlockNode;
  props: SectionProps;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled });

  const summaryParts: string[] = [];
  summaryParts.push(WIDTH_LABEL[props.width]);
  if (props.depth !== "none") {
    summaryParts.push(props.frame === "neoCard" ? "Neo-card" : "Card");
  } else {
    summaryParts.push("No frame");
  }
  if (props.padding !== "normal") summaryParts.push(PADDING_LABEL[props.padding]);
  if (props.background !== "transparent") summaryParts.push("tinted");
  if (props.layout !== "stack") summaryParts.push(LAYOUT_LABEL[props.layout]);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={cn(
        "group/section-header mb-2 flex items-center gap-2 rounded-md px-1 py-1 transition-colors",
        selected
          ? "bg-foreground/8"
          : "hover:bg-foreground/5",
      )}
    >
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "flex shrink-0 cursor-grab items-center rounded-sm p-1 text-muted-foreground/60 hover:text-foreground active:cursor-grabbing",
          "opacity-0 group-hover/section-header:opacity-100",
          selected && "opacity-100",
          "disabled:cursor-not-allowed disabled:opacity-30",
        )}
        title="Drag to reorder section"
        aria-label="Drag to reorder section"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left transition-colors",
          selected
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-md",
            selected
              ? "bg-foreground text-background"
              : "bg-categorical-blue/15 text-categorical-blue",
          )}
        >
          <Layers className="size-3" />
        </span>
        <span className="truncate text-[13px] font-medium">
          {props.label || "Section"}
        </span>
        <span className="hidden truncate text-[11px] text-muted-foreground/70 sm:inline">
          {summaryParts.join(" · ")}
        </span>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (
            confirm(
              "Delete this section? Blocks inside it will reflow into the previous section.",
            )
          ) {
            onRemove();
          }
        }}
        className={cn(
          "flex shrink-0 items-center rounded-sm p-1 text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive",
          "opacity-0 group-hover/section-header:opacity-100",
          selected && "opacity-100",
          "disabled:cursor-not-allowed disabled:opacity-30",
        )}
        title="Delete section"
        aria-label="Delete section"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

const WIDTH_CLASS: Record<SectionProps["width"], string> = {
  narrow: "max-w-3xl px-4",
  content: "max-w-4xl px-4",
  screenXl: "max-w-screen-xl px-4 md:px-8",
  wide: "max-w-[94vw] px-4 xl:max-w-[1400px]",
  full: "max-w-none",
};

const WIDTH_LABEL: Record<SectionProps["width"], string> = {
  narrow: "Narrow",
  content: "Content",
  screenXl: "Screen-xl",
  wide: "Wide",
  full: "Full bleed",
};

const PADDING_LABEL: Record<SectionProps["padding"], string> = {
  none: "No padding",
  compact: "Compact",
  normal: "Normal",
  spacious: "Spacious",
};

const LAYOUT_LABEL: Record<SectionProps["layout"], string> = {
  stack: "Stack",
  twoColumn: "Two-column",
  threeColumn: "Three-column",
  grid: "Grid",
};
const PADDING_CLASS: Record<SectionProps["padding"], string> = {
  none: "p-0",
  compact: "p-4 md:p-5",
  normal: "p-6 md:p-8",
  spacious: "p-8 md:p-12",
};
const BACKGROUND_CLASS: Record<SectionProps["background"], string> = {
  transparent: "",
  surface: "bg-surface-1",
  muted: "bg-muted/40",
  orange: "bg-categorical-orange/10",
  blue: "bg-categorical-blue/10",
  pink: "bg-categorical-pink/10",
  green: "bg-categorical-green/10",
};
const GAP_CLASS: Record<SectionProps["gap"], string> = {
  compact: "gap-3",
  normal: "gap-6",
  spacious: "gap-10",
};
const LAYOUT_CLASS: Record<SectionProps["layout"], string> = {
  stack: "flex flex-col",
  twoColumn: "grid md:grid-cols-2",
  threeColumn: "grid md:grid-cols-3",
  grid: "grid sm:grid-cols-2 lg:grid-cols-3",
};
