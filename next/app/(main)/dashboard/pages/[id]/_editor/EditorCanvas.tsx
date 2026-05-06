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
import { useMemo } from "react";
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
          <article className="flex w-full flex-col gap-8 py-8 md:gap-10 md:py-12">
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
        "group/section relative mx-auto w-full transition-[outline]",
        WIDTH_CLASS[props.width],
        sectionSelected &&
          "rounded-md outline outline-2 outline-foreground/40 outline-offset-4",
      )}
    >
      {sectionBlock && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(sectionBlock.id);
          }}
          className={cn(
            "absolute -top-3 left-2 z-10 flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground shadow-sm",
            "opacity-0 group-hover/section:opacity-100 transition-opacity",
            sectionSelected &&
              "opacity-100 border-foreground text-foreground",
          )}
          title={`Section: ${props.label}`}
        >
          <span className="size-1.5 rounded-full bg-categorical-blue" />
          {props.label || "Section"}
        </button>
      )}
      {frame}
    </section>
  );
}

const WIDTH_CLASS: Record<SectionProps["width"], string> = {
  narrow: "max-w-3xl px-4",
  content: "max-w-4xl px-4",
  screenXl: "max-w-screen-xl px-4 md:px-8",
  wide: "max-w-[94vw] px-4 xl:max-w-[1400px]",
  full: "max-w-none",
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
