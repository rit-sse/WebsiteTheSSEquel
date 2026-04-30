"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  ExternalLink,
  Loader2,
  Trash2,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export function PagesListClient({ initialPages, canCreate }: Props) {
  const router = useRouter();
  const [pages] = useState<PageRow[]>(initialPages);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");

  const draftCount = pages.filter((p) => p.status === "DRAFT").length;
  const liveCount = pages.filter((p) => p.status === "PUBLISHED").length;

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

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <Card depth={1} className="p-6">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center justify-between flex-wrap gap-4">
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
        </CardHeader>

        {pages.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            {canCreate
              ? "No pages yet. Create your first one to start building."
              : "No pages yet. Ask a primary officer to create one."}
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {pages.map((p) => (
              <Card
                key={p.id}
                depth={2}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <StatusBadge status={p.status} />
                    {p.systemLocked && (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="h-2.5 w-2.5" />
                        Locked
                      </Badge>
                    )}
                    {p.showInNav && (
                      <Badge variant="outline" className="gap-1">
                        <Eye className="h-2.5 w-2.5" />
                        in nav
                      </Badge>
                    )}
                    {!p.showInNav && p.status === "PUBLISHED" && (
                      <Badge variant="outline" className="gap-1 opacity-60">
                        <EyeOff className="h-2.5 w-2.5" />
                        unlinked
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Updated {new Date(p.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Link
                    href={`/dashboard/pages/${p.id}`}
                    className="font-display text-base font-semibold tracking-tight hover:underline"
                  >
                    {p.title}
                  </Link>
                  <p className="text-xs text-muted-foreground font-mono">
                    /{p.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/${p.slug}?preview=1`} target="_blank">
                    <Button variant="neutral" size="sm">
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Preview
                    </Button>
                  </Link>
                  <Link href={`/dashboard/pages/${p.id}`}>
                    <Button size="sm">Edit</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New page"
      >
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="page-title">Title</Label>
            <Input
              id="page-title"
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (!newSlug) {
                  // Auto-suggest slug from title
                  setNewSlug(slugify(e.target.value));
                }
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
