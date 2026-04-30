"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Folder,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalFooter } from "@/components/ui/modal";

interface CategoryRow {
  id: number;
  slug: string;
  label: string;
  description: string | null;
  isBuiltIn: boolean;
  sortOrder: number;
  photoCount: number;
}

const SLUG_REGEX = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export function CategoriesClient({
  initialCategories,
  canDelete,
}: {
  initialCategories: CategoryRow[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [categories] = useState<CategoryRow[]>(initialCategories);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<CategoryRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState<CategoryRow | null>(null);
  const [busy, setBusy] = useState(false);

  // create form
  const [newSlug, setNewSlug] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");

  async function create() {
    if (!SLUG_REGEX.test(newSlug)) {
      toast.error("Slug must be lowercase letters, digits, hyphens, underscores.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/photo-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: newSlug,
          label: newLabel,
          description: newDescription || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Create failed");
        return;
      }
      toast.success("Category created");
      setCreateOpen(false);
      setNewSlug("");
      setNewLabel("");
      setNewDescription("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <Card depth={1} className="p-6">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Folder className="h-6 w-6 text-primary" />
              <CardTitle>Photo categories</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/photos">
                <Button variant="neutral" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1.5" />
                  Photos
                </Button>
              </Link>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New category
              </Button>
            </div>
          </div>
        </CardHeader>

        <p className="mb-4 text-sm text-muted-foreground">
          Photo carousels and grids on dynamic pages pull from these categories.
          Renames cascade automatically — you can clean up names without breaking
          anything.
        </p>

        <div className="flex flex-col gap-2">
          {categories.map((c) => (
            <Card key={c.id} depth={2} className="p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="font-display text-base font-semibold tracking-tight">
                    {c.label}
                  </p>
                  {c.isBuiltIn && (
                    <Badge variant="outline" className="gap-1 text-[10px]">
                      <Lock className="h-2.5 w-2.5" />
                      Built-in
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px]">
                    {c.photoCount} photo{c.photoCount === 1 ? "" : "s"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{c.slug}</p>
                {c.description && (
                  <p className="text-xs text-muted-foreground/85 mt-1">
                    {c.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() => setEditOpen(c)}
                  aria-label="Edit category"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {canDelete && !c.isBuiltIn && (
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={() => setDeleteOpen(c)}
                    aria-label="Delete category"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Create */}
      <Modal open={createOpen} onOpenChange={setCreateOpen} title="New photo category">
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value.toLowerCase())}
              placeholder="homepage-hero"
              maxLength={80}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Lowercase letters, digits, hyphens, underscores. Used in URLs and
              when assigning photos.
            </p>
          </div>
          <div>
            <Label htmlFor="cat-label">Label</Label>
            <Input
              id="cat-label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Homepage Hero"
              maxLength={120}
            />
          </div>
          <div>
            <Label htmlFor="cat-desc">Description (optional)</Label>
            <Input
              id="cat-desc"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              maxLength={500}
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="neutral" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={create} disabled={busy || !newSlug || !newLabel}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit */}
      <EditCategoryModal
        category={editOpen}
        onClose={() => setEditOpen(null)}
        onSaved={() => router.refresh()}
      />

      {/* Delete */}
      <DeleteCategoryModal
        category={deleteOpen}
        onClose={() => setDeleteOpen(null)}
        otherCategories={categories.filter((c) => c.id !== deleteOpen?.id)}
        onDeleted={() => router.refresh()}
      />
    </div>
  );
}

function EditCategoryModal({
  category,
  onClose,
  onSaved,
}: {
  category: CategoryRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [label, setLabel] = useState(category?.label ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [busy, setBusy] = useState(false);

  // Re-sync when the modal is reopened with a different category.
  useEffect(() => {
    if (category) {
      setSlug(category.slug);
      setLabel(category.label);
      setDescription(category.description ?? "");
    }
  }, [category]);

  async function save() {
    if (!category) return;
    setBusy(true);
    try {
      const body: Record<string, string | undefined> = { label };
      if (slug !== category.slug) body.slug = slug;
      if ((description || null) !== category.description) {
        body.description = description || undefined;
      }
      const res = await fetch(`/api/photo-categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Update failed");
        return;
      }
      toast.success("Category updated");
      onSaved();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={!!category}
      onOpenChange={(o) => !o && onClose()}
      title={category ? `Edit “${category.label}”` : ""}
    >
      {category && (
        <>
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                maxLength={80}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Renaming the slug propagates to every photo via the FK.
                Existing carousels keep working.
              </p>
            </div>
            <div>
              <Label htmlFor="edit-label">Label</Label>
              <Input
                id="edit-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={120}
              />
            </div>
            <div>
              <Label htmlFor="edit-desc">Description</Label>
              <Input
                id="edit-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>
          <ModalFooter>
            <Button variant="neutral" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}

function DeleteCategoryModal({
  category,
  otherCategories,
  onClose,
  onDeleted,
}: {
  category: CategoryRow | null;
  otherCategories: CategoryRow[];
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [reassignTo, setReassignTo] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const needsReassign = (category?.photoCount ?? 0) > 0;

  async function doDelete() {
    if (!category) return;
    if (needsReassign && !reassignTo) {
      toast.error("Choose a category to reassign photos to.");
      return;
    }
    setBusy(true);
    try {
      const params = new URLSearchParams();
      if (needsReassign) params.set("reassignTo", reassignTo);
      const res = await fetch(
        `/api/photo-categories/${category.id}${params.size ? `?${params}` : ""}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Delete failed");
        return;
      }
      toast.success("Category deleted");
      onDeleted();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={!!category}
      onOpenChange={(o) => !o && onClose()}
      title={category ? `Delete “${category.label}”?` : ""}
    >
      {category && (
        <>
          <div className="flex flex-col gap-4 text-sm">
            <p>
              {needsReassign
                ? `${category.photoCount} photo${category.photoCount === 1 ? "" : "s"} are tagged with this category. Pick a category to move them to first.`
                : "No photos use this category — it can be deleted right away."}
            </p>
            {needsReassign && (
              <div>
                <Label htmlFor="reassign">Move photos to</Label>
                <select
                  id="reassign"
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
                >
                  <option value="">Choose category…</option>
                  {otherCategories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.label} ({c.photoCount})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <ModalFooter>
            <Button variant="neutral" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={doDelete} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}
