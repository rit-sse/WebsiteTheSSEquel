/**
 * PageRenderer — walks a page's content blocks and renders each.
 *
 * Used by the public catch-all (`app/[...slug]/page.tsx`) and by the
 * dashboard preview iframe. Unknown block types render a small admin
 * notice (in preview mode) or are silently skipped (in production).
 */
import { Children, type ReactNode } from "react";
import RevealOnScroll from "@/components/common/RevealOnScroll";
import { Card } from "@/components/ui/card";
import { NeoCard } from "@/components/ui/neo-card";
import { cn } from "@/lib/utils";
import type {
  BlockNode,
  PageContent,
  SectionProps,
} from "@/lib/pageBuilder/blocks";
import { getRender } from "./registry";

interface Props {
  content: PageContent | null | undefined;
  preview?: boolean;
}

export function PageRenderer({ content, preview }: Props) {
  if (!content) {
    return preview ? (
      <div className="rounded-lg border border-dashed border-border/40 bg-card p-6 text-sm text-muted-foreground">
        This page has no content yet. Add a block to get started.
      </div>
    ) : null;
  }

  if (content.blocks.length === 0) {
    return preview ? (
      <div className="rounded-lg border border-dashed border-border/40 bg-card p-6 text-sm text-muted-foreground">
        Empty page. Add a block in the dashboard editor.
      </div>
    ) : null;
  }

  const sections = groupIntoSections(content.blocks);

  return (
    <article className="flex w-full flex-col gap-8 py-8 md:gap-10 md:py-12">
      {sections.map((section) => (
        <SectionShell key={section.key} props={section.props} preview={preview}>
          {section.blocks.map((block) => renderBlock(block, preview))}
        </SectionShell>
      ))}
    </article>
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

interface SectionGroup {
  key: string;
  props: SectionProps;
  blocks: BlockNode[];
}

function groupIntoSections(blocks: BlockNode[]): SectionGroup[] {
  const groups: SectionGroup[] = [];
  let current: SectionGroup = {
    key: "implicit-section",
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
    (group) => group.blocks.length > 0 || group.key !== "implicit-section",
  );
}

function renderBlock(block: BlockNode, preview?: boolean) {
  const Render = getRender(block.type);
  if (!Render || block.type === "section") {
    return preview ? (
      <UnknownBlockNotice key={block.id} type={block.type} />
    ) : null;
  }
  return <Render key={block.id} props={block.props} preview={preview} />;
}

function SectionShell({
  props,
  children,
  preview,
}: {
  props: SectionProps;
  children: ReactNode;
  preview?: boolean;
}) {
  const hasChildren = Children.count(children) > 0;
  const content = (
    <div
      className={cn(
        "w-full",
        LAYOUT_CLASS[props.layout],
        GAP_CLASS[props.gap],
        props.layout !== "stack" && "items-start",
        props.layout !== "stack" && "[&>*]:my-0",
      )}
    >
      {children}
      {preview && !hasChildren && (
        <div className="rounded-lg border border-dashed border-border/40 p-6 text-sm text-muted-foreground">
          Empty section.
        </div>
      )}
    </div>
  );

  const inner =
    props.depth === "none" ? (
      <div
        className={cn(
          BACKGROUND_CLASS[props.background],
          PADDING_CLASS[props.padding],
        )}
      >
        {content}
      </div>
    ) : props.frame === "neoCard" ? (
      <NeoCard
        className={cn(
          BACKGROUND_CLASS[props.background],
          PADDING_CLASS[props.padding],
        )}
      >
        {content}
      </NeoCard>
    ) : (
      <Card
        depth={Number(props.depth) as 1 | 2 | 3}
        className={cn(
          BACKGROUND_CLASS[props.background],
          PADDING_CLASS[props.padding],
        )}
      >
        {content}
      </Card>
    );

  return (
    <section className={cn("mx-auto w-full", WIDTH_CLASS[props.width])}>
      {props.revealOnScroll ? <RevealOnScroll>{inner}</RevealOnScroll> : inner}
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

function UnknownBlockNotice({ type }: { type: string }) {
  return (
    <div className="my-4 rounded border border-categorical-pink bg-categorical-pink/10 p-3 text-xs">
      <span className="font-mono font-bold uppercase">
        [unknown block: {type}]
      </span>{" "}
      <span className="text-muted-foreground">
        — block type missing from registry. Did a deploy lag behind?
      </span>
    </div>
  );
}
