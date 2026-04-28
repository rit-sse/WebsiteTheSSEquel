"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Calendar,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalFooter } from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DashboardPhotoEvent } from "./DashboardPhotosClient";

export type ManagedPhoto = {
  id: number;
  imageUrl: string;
  caption: string | null;
  altText: string | null;
  category: string;
  eventId?: string | null;
  event: DashboardPhotoEvent | null;
  photoDate: string | null;
  uploadedAt: string;
  sortDate: string;
  status: string;
  originalFilename: string;
};

type ManagedGroup = {
  key: string;
  label: string;
  photos: ManagedPhoto[];
};

export function PhotoManagementTable({
  photos,
  events,
  categories,
  onChange,
  onLoadMore,
  hasMore,
  totalPhotoCount,
}: {
  photos: ManagedPhoto[];
  events: DashboardPhotoEvent[];
  categories: string[];
  onChange: () => Promise<void> | void;
  onLoadMore?: () => Promise<void> | void;
  hasMore: boolean;
  totalPhotoCount: number;
}) {
  const [editing, setEditing] = useState<ManagedPhoto | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ManagedPhoto | null>(null);
  const [busy, setBusy] = useState(false);

  const groups = useMemo(() => groupByMonth(photos), [photos]);

  async function togglePublished(photo: ManagedPhoto) {
    const nextStatus =
      photo.status === "published" ? "hidden" : "published";
    const response = await fetch(`/api/photos/${photo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      toast.error(error.error || "Failed to update photo");
      return;
    }

    toast.success(nextStatus === "published" ? "Published" : "Hidden");
    await onChange();
  }

  async function deletePhoto(photo: ManagedPhoto) {
    setBusy(true);
    try {
      const response = await fetch(`/api/photos/${photo.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        toast.error(error.error || "Failed to delete photo");
        return;
      }
      toast.success("Photo deleted");
      setConfirmDelete(null);
      await onChange();
    } finally {
      setBusy(false);
    }
  }

  if (photos.length === 0) {
    return (
      <Card depth={2} className="p-12 text-center">
        <h3 className="font-display text-xl font-semibold">No photos yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload some on the Upload tab to get started.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display text-2xl font-bold leading-tight">
            Manage photos
          </h2>
          <p className="text-sm text-muted-foreground">
            Showing {photos.length.toLocaleString()} of{" "}
            {totalPhotoCount.toLocaleString()} records, newest first.
          </p>
        </div>
      </div>

      {groups.map((group) => (
        <section key={group.key} className="space-y-3">
          <div className="flex items-baseline gap-3 sticky top-0 z-10 -mx-1 px-1 py-2 backdrop-blur-md bg-surface-1/85 supports-[backdrop-filter]:bg-surface-1/70 rounded-md">
            <h3 className="font-display text-lg font-bold">{group.label}</h3>
            <span className="text-xs text-muted-foreground">
              {group.photos.length}{" "}
              {group.photos.length === 1 ? "photo" : "photos"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {group.photos.map((photo) => (
              <ManageTile
                key={photo.id}
                photo={photo}
                onEdit={() => setEditing(photo)}
                onTogglePublished={() => togglePublished(photo)}
                onDelete={() => setConfirmDelete(photo)}
              />
            ))}
          </div>
        </section>
      ))}

      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-2">
          <Button variant="neutral" onClick={() => void onLoadMore()}>
            Load more
          </Button>
        </div>
      )}

      {editing && (
        <EditPhotoModal
          photo={editing}
          events={events}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await onChange();
          }}
        />
      )}

      <Modal
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete photo?"
      >
        <p className="text-sm text-muted-foreground">
          This permanently removes the original and gallery copies from S3 and
          the database record.
        </p>
        {confirmDelete && (
          <Card depth={2} className="p-3 mt-3 flex gap-3 items-center">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border/40">
              <Image
                src={confirmDelete.imageUrl}
                alt={confirmDelete.originalFilename}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <p className="text-sm truncate">
              {confirmDelete.originalFilename}
            </p>
          </Card>
        )}
        <ModalFooter>
          <Button variant="neutral" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => confirmDelete && deletePhoto(confirmDelete)}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                Delete
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

function ManageTile({
  photo,
  onEdit,
  onTogglePublished,
  onDelete,
}: {
  photo: ManagedPhoto;
  onEdit: () => void;
  onTogglePublished: () => void;
  onDelete: () => void;
}) {
  const isHidden = photo.status !== "published";
  return (
    <div
      className={[
        "group relative aspect-square overflow-hidden rounded-md bg-surface-2",
        "neo:border-2 neo:border-border/40",
        "clean:border clean:border-border/20",
        isHidden && "ring-2 ring-amber-500/60",
      ].filter(Boolean).join(" ")}
    >
      <Image
        src={photo.imageUrl}
        alt={photo.altText || photo.caption || photo.originalFilename}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
        className={[
          "object-cover transition-transform duration-200",
          "group-hover:scale-[1.04]",
          isHidden && "opacity-70",
        ].filter(Boolean).join(" ")}
        loading="lazy"
      />

      {/* Top status row */}
      <div className="absolute left-1.5 right-1.5 top-1.5 flex items-start justify-between gap-1.5">
        {isHidden ? (
          <Badge variant="secondary" className="bg-amber-500/90 text-white border-0">
            <EyeOff className="mr-1 size-3" />
            Hidden
          </Badge>
        ) : (
          <span />
        )}
        <Badge variant="outline" className="bg-black/55 text-white/95 border-white/20 capitalize">
          {photo.category}
        </Badge>
      </div>

      {/* Hover overlay with actions + caption */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100" />

      <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        <p className="truncate text-xs font-semibold text-white">
          {photo.caption || photo.event?.title || photo.originalFilename}
        </p>
        <p className="truncate text-[10px] text-white/75">
          {formatPhotoDate(photo.sortDate)}
        </p>
        <div className="mt-2 flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="flex h-7 flex-1 items-center justify-center gap-1 rounded-sm bg-white/15 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/25"
          >
            <Pencil className="size-3" />
            Edit
          </button>
          <button
            type="button"
            onClick={onTogglePublished}
            className="flex h-7 w-7 items-center justify-center rounded-sm bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
            title={isHidden ? "Publish" : "Hide"}
            aria-label={isHidden ? "Publish photo" : "Hide photo"}
          >
            {isHidden ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-sm bg-destructive/80 text-white backdrop-blur-sm hover:bg-destructive"
            title="Delete"
            aria-label="Delete photo"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EditPhotoModal({
  photo,
  events,
  categories,
  onClose,
  onSaved,
}: {
  photo: ManagedPhoto;
  events: DashboardPhotoEvent[];
  categories: string[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [altText, setAltText] = useState(photo.altText ?? "");
  const [category, setCategory] = useState(photo.category);
  const [eventId, setEventId] = useState(photo.eventId ?? "");
  const [manualTakenAt, setManualTakenAt] = useState(
    toDateInputValue(photo.photoDate)
  );
  const [status, setStatus] = useState(photo.status);
  const [saving, setSaving] = useState(false);

  // Reset whenever a different photo is loaded into the modal — guards
  // against stale form state when officers click rapidly between tiles.
  useEffect(() => {
    setCaption(photo.caption ?? "");
    setAltText(photo.altText ?? "");
    setCategory(photo.category);
    setEventId(photo.eventId ?? "");
    setManualTakenAt(toDateInputValue(photo.photoDate));
    setStatus(photo.status);
  }, [photo]);

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch(`/api/photos/${photo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: caption || null,
          altText: altText || null,
          category,
          eventId: eventId || null,
          manualTakenAt: manualTakenAt || null,
          status,
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        toast.error(error.error || "Failed to save photo");
        return;
      }
      toast.success("Photo updated");
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title="Edit photo"
      className="max-w-3xl"
    >
      <div className="grid gap-5 md:grid-cols-[200px_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-md border border-border/40 bg-black">
            <Image
              src={photo.imageUrl}
              alt={altText || caption || photo.originalFilename}
              fill
              className="object-cover"
              sizes="200px"
            />
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p className="truncate" title={photo.originalFilename}>
              {photo.originalFilename}
            </p>
            <p className="inline-flex items-center gap-1">
              <Calendar className="size-3" />
              {formatPhotoDate(photo.sortDate)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-caption">Caption</Label>
            <Input
              id="edit-caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="What's happening in this photo?"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-alt">Alt text</Label>
            <Textarea
              id="edit-alt"
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              placeholder="Describe the image for screen readers."
              rows={2}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item}>
                      <span className="capitalize">{item}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Event</Label>
              <Select
                value={eventId || "none"}
                onValueChange={(value) =>
                  setEventId(value === "none" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No event</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-date">Photo date override</Label>
              <Input
                id="edit-date"
                type="date"
                value={manualTakenAt}
                onChange={(event) => setManualTakenAt(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Used to sort the photo in the gallery.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Visibility</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="neutral" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function groupByMonth(photos: ManagedPhoto[]): ManagedGroup[] {
  const map = new Map<string, ManagedGroup>();
  for (const photo of photos) {
    const date = new Date(photo.sortDate);
    if (Number.isNaN(date.getTime())) continue;
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const existing = map.get(key);
    if (existing) {
      existing.photos.push(photo);
    } else {
      map.set(key, {
        key,
        label: new Intl.DateTimeFormat("en-US", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(date),
        photos: [photo],
      });
    }
  }
  return Array.from(map.values());
}

function toDateInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatPhotoDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
