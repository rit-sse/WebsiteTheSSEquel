"use client";

/**
 * PageEditorClient — the page-builder editor.
 *
 * Layout:
 * - Top bar: title, slug, status, Preview / Publish / Settings buttons,
 *   live autosave indicator.
 * - Left rail (desktop) / drawer (mobile): block list with drag-to-reorder
 *   via @dnd-kit/sortable. Click a block row to edit it.
 * - Right pane: the selected block's editor form (looked up in
 *   editor registry by block.type).
 * - Settings drawer: page-level config (slug, SEO, nav).
 *
 * Persistence: every change to the block list or settings triggers a
 * 1.5s-debounced PUT /api/pages/[id]. On error, the toast surfaces
 * with a retry suggestion. Concurrent-edit conflicts (409) prompt a
 * full-page reload.
 */

import { createElement, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  ChevronLeft,
  ExternalLink,
  GripVertical,
  History,
  Loader2,
  Lock,
  Plus,
  Save,
  Settings,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BLOCK_META,
  type BlockNode,
  type BlockType,
  type PageContent,
} from "@/lib/pageBuilder/blocks";
import { getEditor } from "@/components/page-blocks/editors";
import { PageSettingsDrawer } from "./PageSettingsDrawer";
import { AddBlockMenu } from "./AddBlockMenu";

interface PageMeta {
  id: number;
  slug: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  systemLocked: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  showInNav: boolean;
  navSection: string;
  navLabel: string | null;
  navOrder: number;
  updatedAt: string;
  publishedAt: string | null;
}

interface Props {
  page: PageMeta;
  initialContent: PageContent;
  isPrimary: boolean;
}

type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DEBOUNCE_MS = 1500;

export function PageEditorClient({ page: initialPage, initialContent, isPrimary }: Props) {
  const router = useRouter();
  const [page, setPage] = useState<PageMeta>(initialPage);
  const [content, setContent] = useState<PageContent>(initialContent);
  const [selected, setSelected] = useState<string | null>(initialContent.blocks[0]?.id ?? null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [publishing, setPublishing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const isLocked = page.systemLocked;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Track the latest payload for autosave (avoid stale closures).
  const pendingRef = useRef<{
    content: PageContent;
    meta: PageMeta;
  }>({ content, meta: page });
  pendingRef.current = { content, meta: page };

  const debounceTimerRef = useRef<number | null>(null);

  const persist = useCallback(async () => {
    setSaveState("saving");
    const { content: cur, meta: m } = pendingRef.current;
    try {
      const res = await fetch(`/api/pages/${m.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: m.title,
          draftContent: cur,
          showInNav: m.showInNav,
          navSection: m.navSection,
          navLabel: m.navLabel,
          navOrder: m.navOrder,
          seoTitle: m.seoTitle,
          seoDescription: m.seoDescription,
          expectedUpdatedAt: m.updatedAt,
        }),
      });
      if (res.status === 409) {
        toast.error("Page changed elsewhere — reload to see latest", {
          action: { label: "Reload", onClick: () => router.refresh() },
        });
        setSaveState("error");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Save failed");
        setSaveState("error");
        return;
      }
      const json = await res.json();
      // Update the page meta with new updatedAt for next conflict check.
      setPage((p) => ({ ...p, updatedAt: json.page.updatedAt }));
      setSaveState("saved");
      // Drop back to idle after a moment so the indicator re-arms.
      window.setTimeout(() => {
        setSaveState((s) => (s === "saved" ? "idle" : s));
      }, 1200);
    } catch (err) {
      console.error(err);
      toast.error("Network error saving");
      setSaveState("error");
    }
  }, [router]);

  function scheduleSave() {
    if (isLocked) return;
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(persist, AUTOSAVE_DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    };
  }, []);

  function updateContent(next: PageContent) {
    setContent(next);
    scheduleSave();
  }

  function updateBlockProps(id: string, nextProps: BlockNode["props"]) {
    const blocks = content.blocks.map((b) =>
      b.id === id ? ({ ...b, props: nextProps } as BlockNode) : b
    );
    updateContent({ ...content, blocks });
  }

  function addBlock(type: BlockType) {
    const meta = BLOCK_META[type];
    const id = crypto.randomUUID();
    const block = { id, type, props: { ...meta.defaultProps } } as BlockNode;
    updateContent({ ...content, blocks: [...content.blocks, block] });
    setSelected(id);
    setAddOpen(false);
  }

  function removeBlock(id: string) {
    const idx = content.blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const blocks = content.blocks.filter((b) => b.id !== id);
    updateContent({ ...content, blocks });
    if (selected === id) {
      setSelected(blocks[Math.min(idx, blocks.length - 1)]?.id ?? null);
    }
  }

  function duplicateBlock(id: string) {
    const block = content.blocks.find((b) => b.id === id);
    if (!block) return;
    const clone = { ...block, id: crypto.randomUUID() };
    const blocks = [...content.blocks];
    const idx = blocks.findIndex((b) => b.id === id);
    blocks.splice(idx + 1, 0, clone);
    updateContent({ ...content, blocks });
    setSelected(clone.id);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = content.blocks.findIndex((b) => b.id === active.id);
    const newIndex = content.blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    updateContent({
      ...content,
      blocks: arrayMove(content.blocks, oldIndex, newIndex),
    });
  }

  async function publish() {
    setPublishing(true);
    // Force a final save before publish so the API operates on the
    // latest draft (otherwise we'd publish whatever was last persisted).
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    try {
      await persist();
      const res = await fetch(`/api/pages/${page.id}/publish`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Publish failed");
        return;
      }
      const json = await res.json();
      if (json.noop) {
        toast.success("Already published — no changes to broadcast");
      } else {
        toast.success(
          `Published v${json.version?.version ?? "?"}`,
          { description: `${page.slug} is now live` }
        );
      }
      router.refresh();
      setPage((p) => ({ ...p, status: "PUBLISHED" }));
    } catch (err) {
      console.error(err);
      toast.error("Network error publishing");
    } finally {
      setPublishing(false);
    }
  }

  async function unpublish() {
    if (!confirm("Unpublish this page? It will return to draft and stop serving anonymously.")) return;
    const res = await fetch(`/api/pages/${page.id}/unpublish`, {
      method: "POST",
    });
    if (res.ok) {
      toast.success("Page unpublished");
      setPage((p) => ({ ...p, status: "DRAFT" }));
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Unpublish failed");
    }
  }

  const selectedBlock = content.blocks.find((b) => b.id === selected) ?? null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* ── Top bar ── */}
      <div className="sticky top-[4.5rem] z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Link
            href="/dashboard/pages"
            className="text-muted-foreground hover:text-foreground"
            aria-label="Back to pages"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="font-display text-lg font-semibold tracking-tight truncate max-w-xs">
              {page.title}
            </h1>
            <span className="font-mono text-xs text-muted-foreground truncate">
              /{page.slug}
            </span>
            {isLocked && (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-2.5 w-2.5" />
                System-locked
              </Badge>
            )}
            <StatusBadge status={page.status} />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <SaveIndicator state={saveState} />
            <Link href={`/${page.slug}?preview=1`} target="_blank">
              <Button variant="neutral" size="sm">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Preview
              </Button>
            </Link>
            <Button
              variant="neutral"
              size="sm"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Settings
            </Button>
            {page.status === "PUBLISHED" ? (
              <>
                <Button variant="neutral" size="sm" onClick={unpublish} disabled={isLocked}>
                  Unpublish
                </Button>
                <Button size="sm" onClick={publish} disabled={publishing || isLocked}>
                  {publishing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Publishing…
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      Republish
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={publish} disabled={publishing || isLocked}>
                {publishing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Publishing…
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Publish
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLocked && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-4">
          <div className="flex items-start gap-2 rounded-md border-2 border-categorical-pink bg-categorical-pink/10 p-3 text-sm">
            <Lock className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <strong className="font-display uppercase tracking-wider text-xs">
                System-locked page
              </strong>
              <p className="text-muted-foreground mt-0.5">
                This page is owned by another system (e.g., the amendment
                process). Edits are read-only here.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Editor body ── */}
      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-[20rem_1fr]">
        {/* Block list */}
        <aside className="lg:sticky lg:top-32 lg:max-h-[calc(100vh-10rem)] lg:overflow-auto">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground">
              Blocks ({content.blocks.length})
            </h2>
            <Button
              variant="neutral"
              size="sm"
              onClick={() => setAddOpen(true)}
              disabled={isLocked}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={content.blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col gap-1.5">
                {content.blocks.map((block) => (
                  <BlockRow
                    key={block.id}
                    block={block}
                    selected={block.id === selected}
                    onSelect={() => setSelected(block.id)}
                    onDuplicate={() => duplicateBlock(block.id)}
                    onRemove={() => removeBlock(block.id)}
                    locked={isLocked}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          {content.blocks.length === 0 && (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No blocks yet.{" "}
              <button
                onClick={() => setAddOpen(true)}
                disabled={isLocked}
                className="underline hover:text-foreground disabled:no-underline"
              >
                Add your first block
              </button>
              .
            </div>
          )}
        </aside>

        {/* Editor pane */}
        <section className="rounded-lg border border-border bg-card p-5 md:p-6 min-h-[24rem]">
          {selectedBlock ? (
            <BlockEditorPane
              block={selectedBlock}
              onChange={(props) => updateBlockProps(selectedBlock.id, props)}
              disabled={isLocked}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {content.blocks.length === 0
                ? "Add a block to start editing."
                : "Select a block from the list to edit."}
            </div>
          )}
        </section>
      </div>

      <AddBlockMenu
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addBlock}
        canAddPrimaryOnly={isPrimary}
      />

      <PageSettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        page={page}
        onChange={(patch) => {
          setPage((p) => ({ ...p, ...patch }));
          scheduleSave();
        }}
        canEditSlug={isPrimary}
        canEditLock={isPrimary}
        disabled={isLocked && page.systemLocked}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: PageMeta["status"] }) {
  if (status === "PUBLISHED") {
    return <Badge className="bg-categorical-green text-foreground">Live</Badge>;
  }
  if (status === "DRAFT") {
    return <Badge variant="secondary">Draft</Badge>;
  }
  return <Badge variant="outline">Archived</Badge>;
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-categorical-green">
        <Check className="h-3 w-3" />
        Saved
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="text-xs text-destructive font-medium">Save failed</span>
    );
  }
  return null;
}

function BlockRow({
  block,
  selected,
  onSelect,
  onRemove,
  onDuplicate,
  locked,
}: {
  block: BlockNode;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  locked: boolean;
}) {
  const meta = BLOCK_META[block.type];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const summary = blockSummary(block);

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={[
        "group flex items-center gap-2 rounded-md border bg-card px-2.5 py-2 text-sm transition-colors",
        selected
          ? "border-foreground ring-2 ring-foreground/15"
          : "border-border hover:border-foreground/50",
      ].join(" ")}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
        disabled={locked}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 text-left"
      >
        <p className="font-display font-semibold text-xs uppercase tracking-wider truncate">
          {meta.label}
        </p>
        <p className="truncate text-xs text-muted-foreground">{summary}</p>
      </button>
      <button
        type="button"
        onClick={onDuplicate}
        disabled={locked}
        className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        aria-label="Duplicate block"
        title="Duplicate"
      >
        <Plus className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        disabled={locked}
        className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        aria-label="Delete block"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </li>
  );
}

function blockSummary(block: BlockNode): string {
  switch (block.type) {
    case "heading":
      return block.props.text || "(empty heading)";
    case "markdown":
      return block.props.body.slice(0, 60).replace(/\s+/g, " ").trim() || "(empty)";
    case "image":
      return block.props.alt || block.props.caption || block.props.src || "(no image)";
    case "photoCarousel":
      return `Carousel — ${block.props.categorySlug} • ${block.props.count} photos • ${block.props.intervalMs / 1000}s`;
    case "photoGrid":
      return `Grid — ${block.props.categorySlug} • ${block.props.count} photos • ${block.props.columns} cols`;
    case "eventFeed":
      return `${block.props.mode} events • ${block.props.limit}`;
    case "testimonialRotator":
      return `${block.props.sources.join(" + ")} • ${block.props.count}`;
    case "projectList":
      return `${block.props.mode} projects • ${block.props.limit}`;
    case "officerListing":
      return `${block.props.positionCategory} officers`;
    case "sponsorWall":
      return `${block.props.layout} • ${block.props.onlyActive ? "active" : "all"}`;
    case "zCardRow":
      return `${block.props.items.length} card${block.props.items.length === 1 ? "" : "s"}`;
    case "heroSection":
      return block.props.title;
    case "divider":
      return block.props.label || "—";
    case "cta":
      return `${block.props.text} → ${block.props.href}`;
    case "rawHtml":
      return block.props.html.slice(0, 60).replace(/\s+/g, " ").trim() || "(empty HTML)";
  }
}

function BlockEditorPane({
  block,
  onChange,
  disabled,
}: {
  block: BlockNode;
  onChange: (props: BlockNode["props"]) => void;
  disabled: boolean;
}) {
  const Editor = getEditor(block.type);
  if (!Editor) {
    return (
      <div className="text-sm text-destructive">
        No editor registered for block type &ldquo;{block.type}&rdquo;.
      </div>
    );
  }
  const meta = BLOCK_META[block.type];
  // Use createElement instead of <Editor> JSX so the
  // react-hooks/static-components lint rule recognizes this as a
  // dispatch from a stable registry rather than an inline component.
  // The components themselves are module-scoped — they're not being
  // created on every render.
  return (
    <div className={disabled ? "pointer-events-none opacity-60" : undefined}>
      <header className="mb-5 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">
            {meta.label}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{meta.description}</p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
          {meta.category}
        </Badge>
      </header>
      {createElement(Editor, { props: block.props, onChange })}
    </div>
  );
}
