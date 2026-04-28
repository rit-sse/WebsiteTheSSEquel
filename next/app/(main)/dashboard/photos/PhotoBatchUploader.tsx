"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import * as exifr from "exifr";
import {
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

export type UploadItem = {
  clientId: string;
  file: File;
  galleryBlob: Blob;
  previewUrl: string;
  exifTakenAt: string | null;
  manualTakenAt: string;
  caption: string;
  status: "ready" | "uploading" | "uploaded" | "failed";
  progress: number;
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
  onBatchComplete: (createdCount: number) => Promise<void> | void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [eventId, setEventId] = useState("");
  const [category, setCategory] = useState("general");
  const [batchDate, setBatchDate] = useState("");
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const summary = useMemo(() => {
    const ready = items.filter((item) => item.status === "ready").length;
    const uploaded = items.filter((item) => item.status === "uploaded").length;
    const failed = items.filter((item) => item.status === "failed").length;
    return { ready, uploaded, failed, total: items.length };
  }, [items]);

  const totalSize = useMemo(
    () => items.reduce((sum, item) => sum + item.file.size, 0),
    [items]
  );

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
          progress: 0,
        });
      } catch (error) {
        console.error(error);
        toast.error(`Could not prepare ${file.name}.`);
      }
    }

    setItems((prev) => [...prev, ...nextItems]);
    setProcessing(false);
  }, []);

  function updateItem(clientId: string, patch: Partial<UploadItem>) {
    setItems((prev) =>
      prev.map((item) =>
        item.clientId === clientId ? { ...item, ...patch } : item
      )
    );
  }

  function removeItem(clientId: string) {
    setItems((prev) => {
      const target = prev.find((item) => item.clientId === clientId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.clientId !== clientId);
    });
  }

  function clearAll() {
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setItems([]);
  }

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
      const createdCount = Array.isArray(result.created)
        ? result.created.length
        : 0;
      const failedCount = Array.isArray(result.failed)
        ? result.failed.length
        : 0;
      toast.success(
        `Uploaded ${createdCount} photo${createdCount === 1 ? "" : "s"}.`
      );
      if (failedCount > 0) {
        toast.error(`${failedCount} photo records failed to save.`);
      }
      clearAll();
      await onBatchComplete(createdCount);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Batch defaults — apply to every photo in the queue. The dropzone
          right below picks these up at upload time, so officers can stage
          a giant event drop without touching each card. */}
      <Card depth={2} className="p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-bold">Batch defaults</h2>
          <span className="text-xs text-muted-foreground">
            Applied to every photo in this upload
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Event</Label>
            <Select
              value={eventId || "none"}
              onValueChange={(value) =>
                setEventId(value === "none" ? "" : value)
              }
              disabled={uploading}
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
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={setCategory}
              disabled={uploading}
            >
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
          <div className="space-y-2">
            <Label htmlFor="batch-date">Fallback photo date</Label>
            <Input
              id="batch-date"
              type="date"
              value={batchDate}
              onChange={(event) => setBatchDate(event.target.value)}
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground">
              Used when EXIF and per-photo overrides are blank.
            </p>
          </div>
        </div>
      </Card>

      {/* Drop zone */}
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
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (event.dataTransfer.files.length) {
            void processFiles(event.dataTransfer.files);
          }
        }}
        className={[
          "flex w-full min-h-[180px] flex-col items-center justify-center gap-3 px-6 py-10 text-center transition-all",
          "rounded-lg border-2 border-dashed",
          dragActive
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-border/50 bg-surface-2 hover:border-primary/40 hover:bg-primary/5",
          processing || uploading ? "opacity-80 cursor-progress" : "cursor-pointer",
        ].join(" ")}
        disabled={processing || uploading}
      >
        <div
          className={[
            "rounded-full p-3 transition-colors",
            dragActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
          ].join(" ")}
        >
          {processing ? (
            <Loader2 className="size-7 animate-spin" />
          ) : (
            <Upload className="size-7" />
          )}
        </div>
        <div>
          <p className="font-display text-lg font-semibold">
            {processing
              ? "Preparing images…"
              : dragActive
                ? "Drop to add to the queue"
                : "Drop photos here, or click to browse"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            JPG, PNG, WebP, or GIF up to 25 MB each. Originals are preserved
            and optimized WebP copies are served in the gallery.
          </p>
        </div>
      </button>

      {/* Action bar */}
      {items.length > 0 && (
        <Card depth={2} className="p-4 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ImageIcon className="size-5" />
              </div>
              <div>
                <p className="font-semibold">
                  {summary.total}{" "}
                  {summary.total === 1 ? "photo" : "photos"} in queue
                </p>
                <p className="text-xs text-muted-foreground">
                  {(totalSize / (1024 * 1024)).toFixed(1)} MB total
                  {summary.uploaded > 0 && (
                    <>
                      {" · "}
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3" />
                        {summary.uploaded} uploaded
                      </span>
                    </>
                  )}
                  {summary.failed > 0 && (
                    <>
                      {" · "}
                      <span className="text-destructive">
                        {summary.failed} failed
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="neutral"
                onClick={clearAll}
                disabled={uploading}
              >
                <X className="size-4" />
                Clear
              </Button>
              <Button
                type="button"
                onClick={uploadBatch}
                disabled={uploading || processing || summary.ready === 0}
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    Upload {summary.ready === summary.total ? "batch" : `${summary.ready}`}
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <PhotoUploadQueue
              items={items}
              onChange={updateItem}
              onRemove={removeItem}
            />
          </div>
        </Card>
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
      if (item.status === "uploaded") {
        successful.push(item);
        continue;
      }
      const upload = uploadPlans.get(item.clientId);
      if (!upload) {
        updateItem(item.clientId, {
          status: "failed",
          error: "Missing upload URL",
        });
        continue;
      }

      updateItem(item.clientId, {
        status: "uploading",
        error: undefined,
        progress: 0,
      });
      try {
        await uploadOne(item, upload, (progress) =>
          updateItem(item.clientId, { progress })
        );
        updateItem(item.clientId, { status: "uploaded", progress: 100 });
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

async function uploadOne(
  item: UploadItem,
  upload: UploadPlan,
  onProgress: (value: number) => void
) {
  // Two PUTs — original then gallery WebP. We treat them as a 50/50 split
  // for the per-file progress bar so the user gets a smooth bar instead of
  // a jumpy two-step.
  await retryPut(upload.originalUploadUrl, item.file, item.file.type, (p) =>
    onProgress(Math.round(p * 0.5))
  );
  await retryPut(upload.galleryUploadUrl, item.galleryBlob, "image/webp", (p) =>
    onProgress(50 + Math.round(p * 0.5))
  );
}

async function retryPut(
  url: string,
  body: Blob,
  contentType: string,
  onProgress: (value: number) => void
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await putWithProgress(url, body, contentType, onProgress);
      return;
    } catch (error) {
      lastError = error;
      onProgress(0);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Upload failed");
}

function putWithProgress(
  url: string,
  body: Blob,
  contentType: string,
  onProgress: (value: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    // XHR is the only way to get reliable upload progress events in
    // browsers right now. fetch() is fire-and-forget for upload bytes.
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(100, (event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`S3 returned ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload aborted"));
    xhr.send(body);
  });
}
