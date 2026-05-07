"use client";

/**
 * EditorSidebar — the right rail of the page editor.
 *
 * Sentence-case throughout (no uppercase tracking). Two tabs:
 *   • Outline — section-grouped block list with click-to-select.
 *   • Block — schema form for the currently-selected block, served by
 *     the existing editor registry. Empty state when nothing's
 *     selected.
 *
 * The sidebar's tabs sit sticky at the top so the surface always feels
 * permanent and navigable as the body scrolls.
 */
import { createElement, useMemo } from "react";
import { ChevronDown, ListTree, MousePointerClick } from "lucide-react";
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
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-10 flex shrink-0 items-stretch border-b border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <TabButton
          active={tab === "outline"}
          onClick={() => onTabChange("outline")}
          icon={<ListTree className="size-3.5" />}
          label="Outline"
          count={content.blocks.length}
        />
        <TabButton
          active={tab === "block"}
          onClick={() => onTabChange("block")}
          icon={<MousePointerClick className="size-3.5" />}
          label={
            selectedBlock
              ? BLOCK_META[selectedBlock.type].label
              : "Block"
          }
          disabled={!selectedBlock}
        />
      </div>

      <div className="min-h-0 flex-1">
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
  count,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-colors",
        active
          ? "border-b-2 border-foreground text-foreground"
          : "border-b-2 border-transparent text-muted-foreground hover:text-foreground",
        disabled && "cursor-not-allowed opacity-40 hover:text-muted-foreground",
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
      {count != null && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-mono",
            active ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
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
      <div className="flex h-full flex-col items-center justify-center gap-1.5 px-6 py-12 text-center">
        <ListTree className="size-5 text-muted-foreground/50" />
        <p className="text-[13px] font-medium">Empty page</p>
        <p className="text-xs text-muted-foreground">
          Click the canvas to add your first block.
        </p>
      </div>
    );
  }
  return (
    <ol className="flex flex-col gap-0.5 px-2 py-3">
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
    <li className="mb-1.5 last:mb-0">
      {group.sectionBlock ? (
        <button
          type="button"
          onClick={() => onSelect(group.sectionBlock!.id)}
          className={cn(
            "group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[12px] font-semibold transition-colors",
            sectionSelected
              ? "bg-foreground/8 text-foreground"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          <ChevronDown className="size-3 opacity-60" />
          <span className="truncate">
            {group.sectionBlock.props.label || "Section"}
          </span>
          <span className="ml-auto rounded-full bg-foreground/5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            {group.blocks.length}
          </span>
        </button>
      ) : (
        <p className="px-2 pb-1 pt-1 text-[11px] font-medium text-muted-foreground/60">
          Top of page
        </p>
      )}
      <ol className="ml-2 flex flex-col gap-0.5 border-l border-border/40 pl-2 pt-0.5">
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

const TYPE_DOT_CLASS: Partial<Record<BlockNode["type"], string>> = {
  heading: "bg-categorical-orange",
  markdown: "bg-foreground/40",
  bulletList: "bg-categorical-pink",
  bulletListPair: "bg-categorical-pink",
  cardGrid: "bg-categorical-blue",
  zCardRow: "bg-categorical-blue",
  photoCarousel: "bg-categorical-green",
  photoGrid: "bg-categorical-green",
  appWidget: "bg-categorical-blue",
};

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
  const dot = TYPE_DOT_CLASS[block.type] ?? "bg-muted-foreground/50";
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
          selected
            ? "bg-foreground/8 text-foreground ring-1 ring-foreground/15"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        <span
          className={cn(
            "mt-1.5 inline-flex size-1.5 shrink-0 rounded-full",
            dot,
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium">{meta.label}</p>
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
      return block.props.positionCategory.toLowerCase().replace(/_/g, " ");
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
        <MousePointerClick className="size-5 text-muted-foreground/50" />
        <p className="text-[13px] font-medium">Nothing selected</p>
        <p className="text-xs text-muted-foreground">
          Click a block on the canvas to edit its properties.
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
      <header className="border-b border-border/40 pb-3">
        <h3 className="text-[15px] font-semibold tracking-tight">
          {meta.label}
        </h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {meta.description}
        </p>
      </header>
      {createElement(Editor, {
        props: block.props,
        onChange: (next: BlockNode["props"]) => onUpdate(block.id, next),
      })}
    </div>
  );
}
