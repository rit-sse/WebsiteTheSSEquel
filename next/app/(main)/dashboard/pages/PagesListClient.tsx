"use client";

/**
 * Pages dashboard list.
 *
 * Pages are grouped by status (Drafts → Live → System) so the most
 * actionable buckets surface first. A search box filters titles and
 * slugs as you type; nav-section chips narrow by destination.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Lock,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PageRow {
  id: number;
  slug: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  systemLocked: boolean;
  navSection: string;
  showInNav: boolean;
  publishedAt: string | null;
  updatedAt: string;
  archivedAt: string | null;
}

interface Props {
  initialPages: PageRow[];
  canCreate: boolean;
}

type GroupKey = "drafts" | "live" | "system";

const NAV_SECTIONS: { id: string; label: string }[] = [
  { id: "TOP_LEVEL", label: "Top level" },
  { id: "STUDENTS", label: "Students" },
  { id: "ALUMNI", label: "Alumni" },
  { id: "COMPANIES", label: "Companies" },
  { id: "SE_OFFICE", label: "SE Office" },
  { id: "HIDDEN", label: "Hidden" },
];

export function PagesListClient({ initialPages, canCreate }: Props) {
  const router = useRouter();
  const [pages] = useState<PageRow[]>(initialPages);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [search, setSearch] = useState("");
  const [navFilter, setNavFilter] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<GroupKey, boolean>>({
    drafts: false,
    live: false,
    system: true,
  });

  const draftCount = pages.filter(
    (p) => p.status === "DRAFT" && !p.systemLocked,
  ).length;
  const liveCount = pages.filter((p) => p.status === "PUBLISHED").length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pages.filter((p) => {
      if (q) {
        const hit =
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (navFilter && p.navSection !== navFilter) return false;
      return true;
    });
  }, [pages, search, navFilter]);

  const groups = useMemo<Record<GroupKey, PageRow[]>>(() => {
    const drafts: PageRow[] = [];
    const live: PageRow[] = [];
    const system: PageRow[] = [];
    for (const p of filtered) {
      if (p.systemLocked) system.push(p);
      else if (p.status === "DRAFT") drafts.push(p);
      else if (p.status === "PUBLISHED") live.push(p);
    }
    drafts.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    live.sort((a, b) => {
      const sec = a.navSection.localeCompare(b.navSection);
      if (sec !== 0) return sec;
      return a.title.localeCompare(b.title);
    });
    system.sort((a, b) => a.title.localeCompare(b.title));
    return { drafts, live, system };
  }, [filtered]);

  async function handleCreate() {
    if (!newTitle.trim() || !newSlug.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), slug: newSlug.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to create page");
        return;
      }
      const json = await res.json();
      toast.success("Page created");
      setCreateOpen(false);
      setNewTitle("");
      setNewSlug("");
      router.push(`/dashboard/pages/${json.page.id}`);
    } catch (err) {
      toast.error("Network error");
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  function toggleGroup(g: GroupKey) {
    setCollapsed((c) => ({ ...c, [g]: !c[g] }));
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <Card
        depth={1}
        className="flex flex-col overflow-hidden p-0 lg:max-h-[calc(100dvh-8rem)] lg:min-h-[32rem]"
      >
        <CardHeader className="shrink-0 border-b border-border/60 px-5 py-4 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <CardTitle>Pages</CardTitle>
              <div className="ml-2 hidden gap-2 sm:flex">
                <Badge variant="default">{liveCount} live</Badge>
                <Badge variant="secondary">{draftCount} draft</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/pages/trash">
                <Button variant="neutral" size="sm">
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Trash
                </Button>
              </Link>
              {canCreate && (
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New page
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by title or slug…"
                className="w-full rounded-md border-2 border-border bg-background py-1.5 pl-8 pr-3 text-sm focus:border-foreground focus:outline-none"
                aria-label="Filter pages"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterChip
                active={navFilter == null}
                onClick={() => setNavFilter(null)}
              >
                All sections
              </FilterChip>
              {NAV_SECTIONS.map((s) => (
                <FilterChip
                  key={s.id}
                  active={navFilter === s.id}
                  onClick={() => setNavFilter(s.id)}
                >
                  {s.label}
                </FilterChip>
              ))}
            </div>
          </div>
        </CardHeader>

        {filtered.length === 0 ? (
          <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {pages.length === 0
                ? canCreate
                  ? "No pages yet. Create your first one to start building."
                  : "No pages yet. Ask a primary officer to create one."
                : "No pages match the current filter."}
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 [scrollbar-gutter:stable] md:px-4">
            <PageGroup
              id="drafts"
              label="Drafts"
              tone="orange"
              count={groups.drafts.length}
              collapsed={collapsed.drafts}
              onToggle={() => toggleGroup("drafts")}
              pages={groups.drafts}
            />
            <PageGroup
              id="live"
              label="Live"
              tone="green"
              count={groups.live.length}
              collapsed={collapsed.live}
              onToggle={() => toggleGroup("live")}
              pages={groups.live}
            />
            <PageGroup
              id="system"
              label="System-locked"
              tone="muted"
              count={groups.system.length}
              collapsed={collapsed.system}
              onToggle={() => toggleGroup("system")}
              pages={groups.system}
            />
          </div>
        )}
      </Card>

      <Modal open={createOpen} onOpenChange={setCreateOpen} title="New page">
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="page-title">Title</Label>
            <Input
              id="page-title"
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (!newSlug) setNewSlug(slugify(e.target.value));
              }}
              placeholder="Lab Rules"
              maxLength={200}
            />
          </div>
          <div>
            <Label htmlFor="page-slug">Slug</Label>
            <Input
              id="page-slug"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value.toLowerCase())}
              placeholder="lab-rules"
              maxLength={200}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Lowercase letters, digits, hyphens. Use slashes for nested paths
              (e.g. <code className="font-mono">about/get-involved</code>).
            </p>
          </div>
        </div>
        <ModalFooter>
          <Button variant="neutral" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !newTitle.trim() || !newSlug.trim()}
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating…
              </>
            ) : (
              "Create"
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-muted-foreground hover:border-foreground/60 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function PageGroup({
  label,
  tone,
  count,
  collapsed,
  onToggle,
  pages,
}: {
  id: GroupKey;
  label: string;
  tone: "orange" | "green" | "muted";
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  pages: PageRow[];
}) {
  if (count === 0) return null;
  const toneClass =
    tone === "orange"
      ? "bg-categorical-orange"
      : tone === "green"
        ? "bg-categorical-green"
        : "bg-muted-foreground/40";
  return (
    <section className="mb-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-surface-1"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
        <span className={cn("size-2 rounded-full", toneClass)} />
        <span>{label}</span>
        <span className="ml-1 rounded-full bg-foreground/5 px-1.5 text-[10px] font-mono text-muted-foreground">
          {count}
        </span>
      </button>
      {!collapsed && (
        <ul className="mt-1.5 flex flex-col gap-2 pl-2">
          {pages.map((p) => (
            <PageRowCard key={p.id} page={p} />
          ))}
        </ul>
      )}
    </section>
  );
}

function PageRowCard({ page }: { page: PageRow }) {
  return (
    <li>
      <Card
        depth={2}
        className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <StatusBadge status={page.status} />
            {page.systemLocked && (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-2.5 w-2.5" />
                Locked
              </Badge>
            )}
            {page.showInNav ? (
              <Badge variant="outline" className="gap-1">
                <Eye className="h-2.5 w-2.5" />
                {page.navSection.toLowerCase().replace(/_/g, " ")}
              </Badge>
            ) : (
              page.status === "PUBLISHED" && (
                <Badge variant="outline" className="gap-1 opacity-60">
                  <EyeOff className="h-2.5 w-2.5" />
                  unlinked
                </Badge>
              )
            )}
            <span className="text-[11px] text-muted-foreground">
              · {new Date(page.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <Link
            href={`/dashboard/pages/${page.id}`}
            className="font-display text-base font-semibold tracking-tight hover:underline"
          >
            {page.title}
          </Link>
          <p className="font-mono text-xs text-muted-foreground">
            /{page.slug}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
          <Link
            href={`/${page.slug}?preview=1`}
            target="_blank"
            className="flex-1 sm:flex-none"
          >
            <Button
              variant="neutral"
              size="sm"
              className="w-full sm:w-auto"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Preview
            </Button>
          </Link>
          <Link
            href={`/dashboard/pages/${page.id}`}
            className="flex-1 sm:flex-none"
          >
            <Button size="sm" className="w-full sm:w-auto">
              Edit
            </Button>
          </Link>
        </div>
      </Card>
    </li>
  );
}

function StatusBadge({ status }: { status: PageRow["status"] }) {
  if (status === "PUBLISHED") {
    return <Badge className="bg-categorical-green text-foreground">Live</Badge>;
  }
  if (status === "DRAFT") {
    return <Badge variant="secondary">Draft</Badge>;
  }
  return <Badge variant="outline">Archived</Badge>;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9/]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}
