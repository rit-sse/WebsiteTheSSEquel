"use client";

/**
 * CanvasBlockBody — renders a single block on the canvas.
 *
 * Sync blocks (heading / markdown / image / divider / cta / cardGrid /
 * bulletList / bulletListPair) render fully on the client, with
 * inline-editable text where supported.
 *
 * Dynamic blocks (photoCarousel / zCardRow / appWidget / eventFeed
 * / officerListing / sponsorWall / etc.) render the server-rendered
 * `dynamicSlot` passed in by the page route. When the user edits a
 * dynamic block's props, autosave triggers `router.refresh()` and the
 * server re-renders the slot within ~1.5s. If no slot is provided
 * (e.g., dynamicSlot was suppressed) the canvas falls back to a
 * compact placeholder card.
 */
import type { ReactNode } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BLOCK_META, type BlockNode } from "@/lib/pageBuilder/blocks";
import { InlineText } from "./InlineText";
import { InlineMarkdown } from "./InlineMarkdown";

interface Props {
  block: BlockNode;
  selected: boolean;
  disabled?: boolean;
  onUpdate: (next: BlockNode["props"]) => void;
  onActivate: () => void;
  dynamicSlot?: ReactNode;
}

const HEADING_LEVEL_CLASS: Record<number, string> = {
  1: "font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight",
  2: "font-display text-3xl md:text-4xl font-bold tracking-tight",
  3: "font-display text-2xl md:text-3xl font-semibold tracking-tight",
  4: "font-display text-xl md:text-2xl font-semibold tracking-tight",
};

const ALIGN_CLASS: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const CARD_ACCENT: Record<string, string> = {
  orange: "border-categorical-orange/80 bg-categorical-orange/10",
  blue: "border-categorical-blue/80 bg-categorical-blue/10",
  pink: "border-categorical-pink/80 bg-categorical-pink/10",
  green: "border-categorical-green/80 bg-categorical-green/10",
  neutral: "border-border bg-surface-2",
};

export function CanvasBlockBody({
  block,
  selected,
  disabled,
  onUpdate,
  onActivate,
  dynamicSlot,
}: Props) {
  switch (block.type) {
    case "heading": {
      const Tag = `h${block.props.level}` as
        | "h1"
        | "h2"
        | "h3"
        | "h4";
      return (
        <InlineText
          as={Tag}
          value={block.props.text}
          onCommit={(text) => onUpdate({ ...block.props, text })}
          ariaLabel={`Heading level ${block.props.level}`}
          singleLine
          disabled={disabled}
          onActivate={onActivate}
          className={cn(
            "mb-3 mt-8 first:mt-0 scroll-mt-24",
            HEADING_LEVEL_CLASS[block.props.level],
            ALIGN_CLASS[block.props.align],
            block.props.accent === "primary" && "text-primary",
          )}
        />
      );
    }
    case "markdown":
      return (
        <InlineMarkdown
          value={block.props.body}
          align={block.props.align}
          onCommit={(body) => onUpdate({ ...block.props, body })}
          disabled={disabled}
          onActivate={onActivate}
        />
      );
    case "image": {
      if (!block.props.src) {
        return <PlaceholderCard block={block} note="No image URL set" />;
      }
      const widthFraction = block.props.widthFraction ?? 1;
      const wClass =
        widthFraction === 1
          ? "w-full"
          : widthFraction === 0.66
            ? "w-full md:w-2/3"
            : widthFraction === 0.5
              ? "w-full md:w-1/2"
              : "w-full md:w-1/3";
      return (
        <figure className={cn("my-6 mx-auto", wClass)}>
          <div className="relative w-full overflow-hidden bg-surface-2"
            style={{ aspectRatio: "16/9" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={block.props.src}
              alt={block.props.alt}
              className={cn(
                "h-full w-full object-cover",
                block.props.rounded ? "rounded-lg" : "",
              )}
            />
          </div>
          {block.props.caption && (
            <figcaption className="mt-2 text-xs italic text-muted-foreground">
              {block.props.caption}
            </figcaption>
          )}
        </figure>
      );
    }
    case "divider":
      return (
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-border" />
          {block.props.label && (
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {block.props.label}
            </span>
          )}
          <span className="h-px flex-1 bg-border" />
        </div>
      );
    case "cta":
      return (
        <div className={cn("my-6", ALIGN_CLASS[block.props.align])}>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border-2 px-5 py-2.5 font-semibold",
              CARD_ACCENT[block.props.variant],
            )}
          >
            {block.props.text}
            <ArrowRight className="h-4 w-4" />
          </span>
          <p className="mt-1 text-[10px] text-muted-foreground">
            → {block.props.href}
          </p>
        </div>
      );
    case "bulletList":
      return (
        <div className="my-6">
          {block.props.heading && (
            <h3 className="text-xl font-semibold mb-3">
              {block.props.heading}
            </h3>
          )}
          <ul className="space-y-2 text-muted-foreground">
            {block.props.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "bulletListPair":
      return (
        <div className="my-2">
          <h2 className="font-display mb-6 text-3xl font-bold">
            {block.props.heading}
          </h2>
          {block.props.description && (
            <p className="mb-6 text-muted-foreground">
              {block.props.description}
            </p>
          )}
          <div className="grid gap-8 md:grid-cols-2">
            {block.props.columns.map((col, i) => (
              <div key={i}>
                <h3 className="mb-3 text-xl font-semibold">{col.heading}</h3>
                <ul className="space-y-2 text-muted-foreground">
                  {col.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span className="mt-1 text-primary">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      );
    case "cardGrid": {
      const columns = Math.min(Math.max(block.props.columns, 1), 4);
      const gridClass =
        columns === 1
          ? "grid-cols-1"
          : columns === 2
            ? "grid-cols-1 sm:grid-cols-2"
            : columns === 3
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
      return (
        <section className="my-8">
          {block.props.heading && (
            <h2 className="font-display mb-4 text-2xl font-bold tracking-tight md:text-3xl">
              {block.props.heading}
            </h2>
          )}
          <div className={cn("grid items-stretch gap-4", gridClass)}>
            {block.props.items.map((item, i) => (
              <Card
                key={i}
                depth={2}
                className={cn(
                  "flex h-full min-h-[10rem] flex-col justify-between border-2 p-5",
                  CARD_ACCENT[item.accent],
                )}
              >
                <div>
                  <h3 className="font-display text-xl font-bold leading-tight">
                    {item.title}
                  </h3>
                  {item.body && (
                    <p className="mt-2 whitespace-pre-line text-sm text-foreground/80">
                      {item.body}
                    </p>
                  )}
                </div>
                {item.href && (
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                    {item.ctaText || "Open"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </Card>
            ))}
          </div>
        </section>
      );
    }
    default:
      // Dynamic blocks: render the server-side slot if provided
      // (the published-page-fidelity render). Fall back to a compact
      // placeholder if the slot is empty (e.g., a brand-new block
      // not yet persisted).
      if (dynamicSlot) {
        return <div className="cms-editor-dynamic-slot">{dynamicSlot}</div>;
      }
      return <PlaceholderCard block={block} note="Save to render preview" />;
  }
}

function PlaceholderCard({
  block,
  note,
}: {
  block: BlockNode;
  note?: string;
}) {
  const meta = BLOCK_META[block.type];
  const summary = describePlaceholder(block);
  return (
    <Card
      depth={2}
      className="my-4 flex items-center gap-3 border-2 border-dashed border-border/60 bg-surface-1/40 p-4"
    >
      <div className="flex size-9 items-center justify-center rounded-md bg-categorical-blue/10 text-categorical-blue">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold tracking-tight">
          {meta.label}
        </p>
        <p className="truncate text-xs text-muted-foreground">{summary}</p>
        {note && (
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            {note}
          </p>
        )}
      </div>
      <p className="hidden text-[10px] uppercase tracking-wider text-muted-foreground sm:block">
        Live render
      </p>
    </Card>
  );
}

function describePlaceholder(block: BlockNode): string {
  switch (block.type) {
    case "photoCarousel":
      return `${block.props.categorySlug} · ${block.props.count} photos · ${block.props.intervalMs / 1000}s · ${block.props.aspectRatio}`;
    case "photoGrid":
      return `${block.props.categorySlug} · ${block.props.count} photos · ${block.props.columns} cols`;
    case "zCardRow":
      return `${block.props.items.length} alternating image+text card${block.props.items.length === 1 ? "" : "s"}`;
    case "appWidget":
      return `Widget: ${block.props.widget}`;
    case "eventFeed":
      return `${block.props.mode} events · ${block.props.limit}`;
    case "testimonialRotator":
      return `Sources: ${block.props.sources.join(", ")} · ${block.props.count}`;
    case "projectList":
      return `${block.props.mode} projects · ${block.props.limit}`;
    case "officerListing":
      return `${block.props.positionCategory.toLowerCase().replace(/_/g, " ")} officers`;
    case "sponsorWall":
      return `${block.props.layout} · ${block.props.onlyActive ? "active only" : "all"}`;
    case "heroSection":
      return block.props.title;
    case "rawHtml":
      return block.props.html ? "Sanitized HTML" : "Empty HTML";
    default:
      return BLOCK_META[block.type].description;
  }
}
