"use client";

import { useCallback, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import * as exifr from "exifr";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DashboardPhotoEvent } from "./DashboardPhotosClient";
import { PhotoUploadQueue } from "./PhotoUploadQueue";

const MAX_WIDTH = 2000;
const GALLERY_QUALITY = 0.82;
const CONCURRENCY = 5;

type UploadItem = {
  clientId: string;
  file: File;
  galleryBlob: Blob;
  previewUrl: string;
  exifTakenAt: string | null;
  manualTakenAt: string;
  caption: string;
  status: "ready" | "uploading" | "uploaded" | "failed";
  error?: string;
};

type UploadPlan = {
  clientId: string;
  originalKey: string;
  originalUploadUrl: string;
  galleryKey: string;
  galleryUploadUrl: string;
};

export function PhotoBatchUploader({
  events,
  categories,
  onBatchComplete,
}: {
  events: DashboardPhotoEvent[];
  categories: string[];
  onBatchComplete: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [eventId, setEventId] = useState("");
  const [category, setCategory] = useState("general");
  const [batchDate, setBatchDate] = useState("");
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setProcessing(true);
    const nextItems: UploadItem[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
        toast.error(`${file.name} is not a supported image.`);
        continue;
      }

      try {
        const [exifTakenAt, galleryBlob] = await Promise.all([
          readExifDate(file),
          imageCompression(file, {
            maxWidthOrHeight: MAX_WIDTH,
            initialQuality: GALLERY_QUALITY,
            fileType: "image/webp",
            useWebWorker: true,
          }),
        ]);

        nextItems.push({
          clientId: crypto.randomUUID(),
          file,
          galleryBlob,
          previewUrl: URL.createObjectURL(galleryBlob),
          exifTakenAt,
          manualTakenAt: "",
          caption: "",
          status: "ready",
        });
      } catch (error) {
        console.error(error);
        toast.error(`Could not prepare ${file.name}.`);
      }
    }

    setItems((prev) => [...prev, ...nextItems]);
    setProcessing(false);
  }, []);

  async function uploadBatch() {
    if (items.length === 0) return;
    setUploading(true);

    try {
      const response = await fetch("/api/photos/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: items.map((item) => ({
            clientId: item.clientId,
            filename: item.file.name,
            originalContentType: item.file.type,
            originalSizeBytes: item.file.size,
            galleryContentType: "image/webp",
            gallerySizeBytes: item.galleryBlob.size,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to prepare uploads");
      }

      const plan: { batchId: string; uploads: UploadPlan[] } =
        await response.json();
      const byClientId = new Map(
        plan.uploads.map((upload) => [upload.clientId, upload])
      );

      const successful = await uploadWithConcurrency(
        items,
        byClientId,
        updateItem
      );

      const completeResponse = await fetch(
        `/api/photos/batches/${plan.batchId}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: eventId || null,
            category,
            batchManualTakenAt: batchDate || null,
            photos: successful.map((item) => {
              const upload = byClientId.get(item.clientId)!;
              return {
                clientId: item.clientId,
                originalKey: upload.originalKey,
                galleryKey: upload.galleryKey,
                originalFilename: item.file.name,
                originalMimeType: item.file.type,
                originalSizeBytes: item.file.size,
                galleryMimeType: "image/webp",
                gallerySizeBytes: item.galleryBlob.size,
                caption: item.caption || null,
                exifTakenAt: item.exifTakenAt,
                manualTakenAt: item.manualTakenAt || null,
              };
            }),
          }),
        }
      );

      if (!completeResponse.ok) {
        const error = await completeResponse.json().catch(() => ({}));
        throw new Error(error.error || "Failed to save photo metadata");
      }

      const result = await completeResponse.json();
      toast.success(
        `Uploaded ${result.created.length} photo${result.created.length === 1 ? "" : "s"}.`
      );
      if (result.failed.length > 0) {
        toast.error(`${result.failed.length} photo records failed to save.`);
      }
      setItems([]);
      onBatchComplete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function updateItem(clientId: string, patch: Partial<UploadItem>) {
    setItems((prev) =>
      prev.map((item) =>
        item.clientId === clientId ? { ...item, ...patch } : item
      )
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border/50 bg-secondary-background p-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Event</Label>
          <Select value={eventId || "none"} onValueChange={(value) => setEventId(value === "none" ? "" : value)}>
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
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Fallback photo date</Label>
          <Input
            type="date"
            value={batchDate}
            onChange={(event) => setBatchDate(event.target.value)}
          />
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files) void processFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />
      <div
        className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-border p-6 text-center"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void processFiles(event.dataTransfer.files);
        }}
      >
        <Upload className="size-8 text-muted-foreground" />
        <div>
          <p className="font-medium">
            {processing ? "Preparing images..." : "Drop photos here"}
          </p>
          <p className="text-sm text-muted-foreground">
            Originals are preserved; optimized WebP copies are used in the gallery.
          </p>
        </div>
      </div>

      {items.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {items.length} photo{items.length === 1 ? "" : "s"} ready
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setItems([])}
                disabled={uploading}
              >
                <X className="size-4" />
                Clear
              </Button>
              <Button onClick={uploadBatch} disabled={uploading || processing}>
                {uploading ? "Uploading..." : "Upload batch"}
              </Button>
            </div>
          </div>
          <PhotoUploadQueue items={items} onChange={updateItem} />
        </>
      )}
    </div>
  );
}

async function readExifDate(file: File): Promise<string | null> {
  try {
    const data = await exifr.parse(file, {
      pick: ["DateTimeOriginal", "CreateDate", "ModifyDate"],
    });
    const value = data?.DateTimeOriginal ?? data?.CreateDate ?? data?.ModifyDate;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }
    return null;
  } catch {
    return null;
  }
}

async function uploadWithConcurrency(
  items: UploadItem[],
  uploadPlans: Map<string, UploadPlan>,
  updateItem: (clientId: string, patch: Partial<UploadItem>) => void
) {
  const successful: UploadItem[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const item = items[index++];
      const upload = uploadPlans.get(item.clientId);
      if (!upload) {
        updateItem(item.clientId, {
          status: "failed",
          error: "Missing upload URL",
        });
        continue;
      }

      updateItem(item.clientId, { status: "uploading", error: undefined });
      try {
        await uploadOne(item, upload);
        updateItem(item.clientId, { status: "uploaded" });
        successful.push(item);
      } catch (error) {
        updateItem(item.clientId, {
          status: "failed",
          error: error instanceof Error ? error.message : "Upload failed",
        });
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => worker())
  );
  return successful;
}

async function uploadOne(item: UploadItem, upload: UploadPlan) {
  await retryPut(upload.originalUploadUrl, item.file, item.file.type);
  await retryPut(upload.galleryUploadUrl, item.galleryBlob, "image/webp");
}

async function retryPut(url: string, body: Blob, contentType: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body,
      });
      if (!response.ok) throw new Error(`S3 returned ${response.status}`);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Upload failed");
}
