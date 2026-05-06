"use client";

/**
 * EditorSidebar — collapsible sidebar with two tabs:
 *
 *   • Outline — section-grouped block list with click-to-select.
 *   • Block — schema form for the currently-selected block, served by
 *     the existing editor registry. Empty state when nothing's
 *     selected.
 */
import { createElement, useMemo } from "react";
import { ChevronDown, ChevronRight, ListTree, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BLOCK_META, type BlockNode, type PageContent } from "@/lib/pageBuilder/blocks";
import { getEditor } from "@/components/page-blocks/editors";

type TabId = "outline" | "block";

interface Props {
  content: PageContent;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, props: BlockNode["props"]) => void;
  tab: TabId;
  onTabChange: (tab: TabId) => void;
  disabled?: boolean;
}

export function EditorSidebar({
  content,
  selected,
  onSelect,
  onUpdate,
  tab,
  onTabChange,
  disabled,
}: Props) {
  const selectedBlock = useMemo(
    () => content.blocks.find((b) => b.id === selected) ?? null,
    [content.blocks, selected],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Tabs */}
      <div className="flex shrink-0 border-b border-border/60">
        <TabButton
          active={tab === "outline"}
          onClick={() => onTabChange("outline")}
          icon={<ListTree className="h-3.5 w-3.5" />}
          label={`Outline · ${content.blocks.length}`}
        />
        <TabButton
          active={tab === "block"}
          onClick={() => onTabChange("block")}
          icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
          label={
            selectedBlock
              ? `Block · ${BLOCK_META[selectedBlock.type].label}`
              : "Block"
          }
          disabled={!selectedBlock}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        {tab === "outline" ? (
          <OutlineTab
            content={content}
            selected={selected}
            onSelect={onSelect}
          />
        ) : (
          <BlockTab block={selectedBlock} onUpdate={onUpdate} disabled={disabled} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-display font-semibold uppercase tracking-wider transition-colors",
        active
          ? "border-b-2 border-foreground text-foreground"
          : "border-b-2 border-transparent text-muted-foreground hover:text-foreground",
        disabled && "cursor-not-allowed opacity-40 hover:text-muted-foreground",
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

// ─────────── Outline tab ───────────

function OutlineTab({
  content,
  selected,
  onSelect,
}: {
  content: PageContent;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const groups = useMemo(() => groupForOutline(content.blocks), [content.blocks]);
  if (content.blocks.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground">
        Empty page. Click on the canvas to add a block.
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-1 px-3 py-3">
      {groups.map((g) => (
        <OutlineGroup
          key={g.key}
          group={g}
          selected={selected}
          onSelect={onSelect}
        />
      ))}
    </ol>
  );
}

interface OutlineGroup {
  key: string;
  sectionBlock: Extract<BlockNode, { type: "section" }> | null;
  blocks: BlockNode[];
}

function groupForOutline(blocks: BlockNode[]): OutlineGroup[] {
  const out: OutlineGroup[] = [];
  let current: OutlineGroup = {
    key: "implicit",
    sectionBlock: null,
    blocks: [],
  };
  for (const b of blocks) {
    if (b.type === "section") {
      if (current.blocks.length > 0 || out.length === 0) {
        out.push(current);
      }
      current = { key: b.id, sectionBlock: b, blocks: [] };
      continue;
    }
    current.blocks.push(b);
  }
  if (current.blocks.length > 0 || out.length === 0) out.push(current);
  return out.filter((g) => g.blocks.length > 0 || g.sectionBlock != null);
}

function OutlineGroup({
  group,
  selected,
  onSelect,
}: {
  group: OutlineGroup;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const sectionSelected =
    group.sectionBlock != null && group.sectionBlock.id === selected;
  return (
    <li>
      {group.sectionBlock ? (
        <button
          type="button"
          onClick={() => onSelect(group.sectionBlock!.id)}
          className={cn(
            "group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs font-display font-semibold uppercase tracking-wider transition-colors",
            sectionSelected
              ? "bg-categorical-blue/15 text-foreground"
              : "text-muted-foreground hover:bg-surface-1 hover:text-foreground",
          )}
        >
          <ChevronDown className="h-3 w-3 opacity-60" />
          <span className="truncate">
            {group.sectionBlock.props.label || "Section"}
          </span>
          <span className="ml-auto rounded-full bg-foreground/5 px-1.5 text-[9px] font-mono text-muted-foreground">
            {group.blocks.length}
          </span>
        </button>
      ) : (
        <p className="px-2 pb-1 pt-2 text-[9px] font-display font-semibold uppercase tracking-wider text-muted-foreground/60">
          Top-level
        </p>
      )}
      <ol className="ml-3 flex flex-col gap-0.5 border-l border-border/40 pl-2">
        {group.blocks.map((b) => (
          <OutlineRow
            key={b.id}
            block={b}
            selected={b.id === selected}
            onSelect={() => onSelect(b.id)}
          />
        ))}
      </ol>
    </li>
  );
}

function OutlineRow({
  block,
  selected,
  onSelect,
}: {
  block: BlockNode;
  selected: boolean;
  onSelect: () => void;
}) {
  const meta = BLOCK_META[block.type];
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
          selected
            ? "bg-foreground/8 text-foreground ring-1 ring-foreground/20"
            : "text-muted-foreground hover:bg-surface-1 hover:text-foreground",
        )}
      >
        <span
          className={cn(
            "mt-0.5 inline-flex size-1.5 shrink-0 rounded-full",
            block.type === "heading"
              ? "bg-categorical-orange"
              : block.type === "markdown"
                ? "bg-foreground/40"
                : "bg-categorical-blue/60",
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-display font-semibold uppercase tracking-wider">
            {meta.label}
          </p>
          <p className="truncate text-[11px] text-muted-foreground/80">
            {summarize(block)}
          </p>
        </div>
      </button>
    </li>
  );
}

function summarize(block: BlockNode): string {
  switch (block.type) {
    case "heading":
      return block.props.text || "(empty heading)";
    case "markdown":
      return (
        block.props.body.slice(0, 60).replace(/\s+/g, " ").trim() || "(empty)"
      );
    case "image":
      return block.props.alt || block.props.src || "(no image)";
    case "cardGrid":
      return `${block.props.items.length} card${block.props.items.length === 1 ? "" : "s"}`;
    case "bulletList":
      return `${block.props.items.length} bullets${block.props.heading ? ` — ${block.props.heading}` : ""}`;
    case "bulletListPair":
      return block.props.heading;
    case "photoCarousel":
      return `${block.props.categorySlug} · ${block.props.count}`;
    case "photoGrid":
      return `${block.props.categorySlug} · ${block.props.count}`;
    case "zCardRow":
      return `${block.props.items.length} cards`;
    case "appWidget":
      return block.props.widget;
    case "cta":
      return `${block.props.text} → ${block.props.href}`;
    case "divider":
      return block.props.label || "—";
    case "rawHtml":
      return block.props.html ? "(html)" : "(empty)";
    case "heroSection":
      return block.props.title;
    case "eventFeed":
      return `${block.props.mode} events`;
    case "testimonialRotator":
      return `${block.props.sources.join("+")} · ${block.props.count}`;
    case "projectList":
      return `${block.props.mode} · ${block.props.limit}`;
    case "officerListing":
      return block.props.positionCategory;
    case "sponsorWall":
      return block.props.layout;
    default:
      return "";
  }
}

// ─────────── Block tab ───────────

function BlockTab({
  block,
  onUpdate,
  disabled,
}: {
  block: BlockNode | null;
  onUpdate: (id: string, props: BlockNode["props"]) => void;
  disabled?: boolean;
}) {
  if (!block) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <SlidersHorizontal className="h-6 w-6 text-muted-foreground/50" />
        <p className="text-sm font-display font-semibold tracking-tight">
          Nothing selected
        </p>
        <p className="text-xs text-muted-foreground">
          Click a block on the canvas to edit its properties here.
        </p>
      </div>
    );
  }
  const Editor = getEditor(block.type);
  const meta = BLOCK_META[block.type];
  if (!Editor) {
    return (
      <p className="px-4 py-6 text-sm text-destructive">
        No editor registered for &ldquo;{block.type}&rdquo;.
      </p>
    );
  }
  return (
    <div
      className={cn(
        "flex flex-col gap-4 px-4 py-4",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <header className="flex items-start justify-between gap-2 border-b border-border/40 pb-3">
        <div className="min-w-0">
          <h3 className="font-display text-base font-bold tracking-tight">
            {meta.label}
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {meta.description}
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-[9px] uppercase tracking-wider"
        >
          {meta.category}
        </Badge>
      </header>
      {createElement(Editor, {
        props: block.props,
        onChange: (next: BlockNode["props"]) => onUpdate(block.id, next),
      })}
    </div>
  );
}
