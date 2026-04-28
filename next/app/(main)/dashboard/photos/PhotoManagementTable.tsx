"use client";

import Image from "next/image";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function PhotoManagementTable({
  photos,
  events,
  categories,
  onChange,
}: {
  photos: ManagedPhoto[];
  events: DashboardPhotoEvent[];
  categories: string[];
  onChange: () => void;
}) {
  async function savePhoto(photo: ManagedPhoto, formData: FormData) {
    const eventId = formData.get("eventId");
    const response = await fetch(`/api/photos/${photo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caption: formData.get("caption"),
        altText: formData.get("altText"),
        eventId: eventId === "none" ? null : eventId || null,
        category: formData.get("category"),
        manualTakenAt: formData.get("manualTakenAt") || null,
        status: formData.get("status"),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      toast.error(error.error || "Failed to save photo");
      return;
    }

    toast.success("Photo updated");
    onChange();
  }

  async function deletePhoto(photo: ManagedPhoto) {
    if (!confirm(`Delete ${photo.originalFilename}?`)) return;
    const response = await fetch(`/api/photos/${photo.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      toast.error(error.error || "Failed to delete photo");
      return;
    }

    toast.success("Photo deleted");
    onChange();
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-2xl font-semibold">Manage photos</h2>
        <p className="text-sm text-muted-foreground">
          Showing the latest {photos.length} records.
        </p>
      </div>
      <div className="space-y-3">
        {photos.map((photo) => (
          <form
            key={photo.id}
            onSubmit={(event) => {
              event.preventDefault();
              void savePhoto(photo, new FormData(event.currentTarget));
            }}
            className="grid gap-3 rounded-lg border border-border/50 bg-secondary-background p-3 lg:grid-cols-[88px_1fr_150px_170px_150px_120px_auto]"
          >
            <div className="relative aspect-square overflow-hidden rounded-md border border-border">
              <Image
                src={photo.imageUrl}
                alt={photo.altText || photo.caption || photo.originalFilename}
                fill
                className="object-cover"
              />
            </div>
            <div className="grid gap-2">
              <Input
                name="caption"
                defaultValue={photo.caption ?? ""}
                placeholder="Caption"
              />
              <Input
                name="altText"
                defaultValue={photo.altText ?? ""}
                placeholder="Alt text"
              />
              <p className="truncate text-xs text-muted-foreground">
                {photo.originalFilename}
              </p>
            </div>
            <Select name="category" defaultValue={photo.category}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select name="eventId" defaultValue={photo.eventId || "none"}>
              <SelectTrigger>
                <SelectValue />
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
            <Input
              name="manualTakenAt"
              type="date"
              defaultValue={toDateInputValue(photo.photoDate)}
            />
            <Select name="status" defaultValue={photo.status}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button type="submit" size="icon" variant="outline">
                <Save className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                onClick={() => deletePhoto(photo)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground lg:col-start-2 lg:col-end-7">
              Sorted as {formatPhotoDate(photo.sortDate)}
            </p>
          </form>
        ))}
      </div>
    </div>
  );
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
  }).format(new Date(value));
}
