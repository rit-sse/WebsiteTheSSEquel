"use client";

/**
 * PageEditorClient — the live-preview page editor.
 *
 * Layout:
 * - EditorTopBar: title (inline-edit), slug, status, save indicator,
 *   viewport switcher, Preview / Settings / Publish buttons.
 * - EditorCanvas: renders the page in full visual fidelity (sync
 *   blocks) or as labeled placeholders (async / dynamic blocks). Each
 *   block is selectable, hoverable, drag-reorderable, and (for headings
 *   / markdown) inline-editable.
 * - EditorSidebar: tabbed (Outline / Block) right rail. Outline shows
 *   a section-grouped block list; Block hosts the existing schema-form
 *   editor for the currently-selected block.
 *
 * Persistence: every content / settings change debounces a 1.5s
 * PUT /api/pages/[id]. 409 conflicts trigger a reload prompt; everything
 * else surfaces via toast.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BLOCK_META,
  type BlockNode,
  type BlockType,
  type PageContent,
} from "@/lib/pageBuilder/blocks";
import { PageSettingsDrawer } from "./PageSettingsDrawer";
import { AddBlockMenu } from "./AddBlockMenu";
import { EditorTopBar, type Viewport } from "./_editor/EditorTopBar";
import { EditorCanvas } from "./_editor/EditorCanvas";
import { EditorSidebar } from "./_editor/EditorSidebar";

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
  /** Server-rendered children for dynamic blocks (photo carousels,
   *  app widgets, event feeds, etc.). Keyed by block id. The canvas
   *  mounts these as the visible body for each dynamic block so the
   *  editor preview matches the published view. Refreshed via
   *  `router.refresh()` after every autosave. */
  dynamicSlots: Record<string, ReactNode>;
}

type SaveState = "idle" | "saving" | "saved" | "error";
type SidebarTab = "outline" | "block";

const AUTOSAVE_DEBOUNCE_MS = 1500;

export function PageEditorClient({
  page: initialPage,
  initialContent,
  isPrimary,
  dynamicSlots,
}: Props) {
  const router = useRouter();
  const [page, setPage] = useState<PageMeta>(initialPage);
  const [content, setContent] = useState<PageContent>(initialContent);
  const [selected, setSelected] = useState<string | null>(
    initialContent.blocks[0]?.id ?? null,
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [publishing, setPublishing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addAfterId, setAddAfterId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("outline");

  const isLocked = page.systemLocked;

  const pendingRef = useRef<{ content: PageContent; meta: PageMeta }>({
    content,
    meta: page,
  });
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
      setPage((p) => ({ ...p, updatedAt: json.page.updatedAt }));
      setSaveState("saved");
      // Re-render server-side dynamic-block slots so the canvas reflects
      // edited dynamic-block props (photo carousel category, app widget
      // selection, etc.) within ~1.5s of the user pausing.
      router.refresh();
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
      if (debounceTimerRef.current)
        window.clearTimeout(debounceTimerRef.current);
    };
  }, []);

  function updateContent(next: PageContent) {
    setContent(next);
    scheduleSave();
  }

  function updateBlockProps(id: string, nextProps: BlockNode["props"]) {
    const blocks = content.blocks.map((b) =>
      b.id === id ? ({ ...b, props: nextProps } as BlockNode) : b,
    );
    updateContent({ ...content, blocks });
  }

  function addBlock(type: BlockType) {
    const meta = BLOCK_META[type];
    const id = crypto.randomUUID();
    const block = { id, type, props: { ...meta.defaultProps } } as BlockNode;
    let nextBlocks: BlockNode[];
    if (addAfterId == null) {
      nextBlocks = [...content.blocks, block];
    } else {
      const idx = content.blocks.findIndex((b) => b.id === addAfterId);
      if (idx === -1) {
        nextBlocks = [...content.blocks, block];
      } else {
        nextBlocks = [...content.blocks];
        nextBlocks.splice(idx + 1, 0, block);
      }
    }
    updateContent({ ...content, blocks: nextBlocks });
    setSelected(id);
    setSidebarTab("block");
    setAddOpen(false);
    setAddAfterId(null);
  }

  function openAddBlock(afterId: string | null) {
    setAddAfterId(afterId);
    setAddOpen(true);
  }

  function selectBlock(id: string | null) {
    setSelected(id);
    if (id) setSidebarTab("block");
  }

  async function publish() {
    setPublishing(true);
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
        toast.success(`Published v${json.version?.version ?? "?"}`, {
          description: `${page.slug} is now live`,
        });
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
    if (
      !confirm(
        "Unpublish this page? It will return to draft and stop serving anonymously.",
      )
    )
      return;
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

  const addCaption =
    addAfterId == null
      ? "Adds at the end of the page."
      : (() => {
          const after = content.blocks.find((b) => b.id === addAfterId);
          return after
            ? `Inserts directly after: ${BLOCK_META[after.type].label}`
            : "Inserts at the end of the page.";
        })();

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] w-full flex-col overflow-x-hidden">
      <EditorTopBar
        title={page.title}
        slug={page.slug}
        status={page.status}
        systemLocked={page.systemLocked}
        saveState={saveState}
        viewport={viewport}
        publishing={publishing}
        isLocked={isLocked}
        onTitleChange={(next) => {
          setPage((p) => ({ ...p, title: next }));
          scheduleSave();
        }}
        onViewportChange={setViewport}
        onOpenSettings={() => setSettingsOpen(true)}
        onPublish={publish}
        onUnpublish={unpublish}
      />

      {isLocked && (
        <div className="mx-auto w-full max-w-[100rem] px-4 pt-4">
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

      <div
        className={cn(
          "mx-auto grid w-full max-w-[100rem] flex-1 grid-cols-1 gap-0 px-0 lg:min-h-[calc(100dvh-13rem)] lg:grid-cols-[minmax(0,1fr)_22rem]",
        )}
      >
        {/* Canvas */}
        <main className="min-w-0 border-r border-border/40 bg-surface-1/30">
          <div className="px-4 py-2 lg:px-8">
            <EditorCanvas
              content={content}
              selected={selected}
              onSelect={selectBlock}
              onChange={updateContent}
              onAddBlockAt={openAddBlock}
              viewport={viewport}
              disabled={isLocked}
              dynamicSlots={dynamicSlots}
            />
          </div>
        </main>

        {/* Sidebar */}
        <aside className="min-w-0 border-t border-border/40 bg-card lg:sticky lg:top-[8.5rem] lg:max-h-[calc(100dvh-9rem)] lg:border-t-0">
          <EditorSidebar
            content={content}
            selected={selected}
            onSelect={selectBlock}
            onUpdate={updateBlockProps}
            tab={sidebarTab}
            onTabChange={setSidebarTab}
            disabled={isLocked}
          />
        </aside>
      </div>

      <AddBlockMenu
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setAddAfterId(null);
        }}
        onAdd={addBlock}
        canAddPrimaryOnly={isPrimary}
        caption={addCaption}
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
