/**
 * PageRenderer — walks a page's content blocks and renders each.
 *
 * Used by the public catch-all (`app/[...slug]/page.tsx`) and by the
 * dashboard preview iframe. Unknown block types render a small admin
 * notice (in preview mode) or are silently skipped (in production).
 */
import type { PageContent } from "@/lib/pageBuilder/blocks";
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

  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-8 md:py-12">
      {content.blocks.map((block) => {
        const Render = getRender(block.type);
        if (!Render) {
          return preview ? (
            <UnknownBlockNotice key={block.id} type={block.type} />
          ) : null;
        }
        return <Render key={block.id} props={block.props} preview={preview} />;
      })}
    </article>
  );
}

function UnknownBlockNotice({ type }: { type: string }) {
  return (
    <div className="my-4 rounded border border-categorical-pink bg-categorical-pink/10 p-3 text-xs">
      <span className="font-mono font-bold uppercase">[unknown block: {type}]</span>{" "}
      <span className="text-muted-foreground">
        — block type missing from registry. Did a deploy lag behind?
      </span>
    </div>
  );
}
