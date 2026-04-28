"use client";

import Image from "next/image";
import { CheckCircle2, Loader2, X, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import type { UploadItem } from "./PhotoBatchUploader";

export function PhotoUploadQueue({
  items,
  onChange,
  onRemove,
}: {
  items: UploadItem[];
  onChange: (clientId: string, patch: Partial<UploadItem>) => void;
  onRemove: (clientId: string) => void;
}) {
  return (
    <ul className="max-h-[640px] space-y-3 overflow-auto pr-1">
      {items.map((item) => {
        const locked = item.status === "uploading" || item.status === "uploaded";
        return (
          <li
            key={item.clientId}
            className={[
              "rounded-lg border bg-surface-1 p-3 transition-colors",
              item.status === "failed"
                ? "border-destructive/40 bg-destructive/5"
                : item.status === "uploaded"
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-border/40",
            ].join(" ")}
          >
            <div className="grid gap-3 md:grid-cols-[88px_minmax(0,1fr)_minmax(0,200px)_auto]">
              {/* Preview */}
              <div className="relative aspect-square w-22 overflow-hidden rounded-md border border-border/40 bg-black">
                <Image
                  src={item.previewUrl}
                  alt={item.file.name}
                  fill
                  className="object-cover"
                  sizes="88px"
                />
                {item.status === "uploaded" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/40">
                    <CheckCircle2 className="size-7 text-white drop-shadow" />
                  </div>
                )}
              </div>

              {/* Caption + filename */}
              <div className="min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                      {item.exifTakenAt
                        ? ` · EXIF ${formatPhotoDate(item.exifTakenAt)}`
                        : " · no EXIF date"}
                    </p>
                  </div>
                  <StatusPill item={item} />
                </div>

                <Input
                  value={item.caption}
                  onChange={(event) =>
                    onChange(item.clientId, { caption: event.target.value })
                  }
                  placeholder="Caption (optional)"
                  disabled={locked}
                  className="h-9"
                />

                {item.status === "uploading" && (
                  <Progress value={item.progress} className="h-1.5" />
                )}
                {item.error && (
                  <p className="text-sm text-destructive">{item.error}</p>
                )}
              </div>

              {/* Per-photo override date */}
              <div className="space-y-1.5">
                <Label
                  htmlFor={`override-${item.clientId}`}
                  className="text-xs font-medium text-muted-foreground"
                >
                  Override date
                </Label>
                <Input
                  id={`override-${item.clientId}`}
                  type="date"
                  value={item.manualTakenAt}
                  onChange={(event) =>
                    onChange(item.clientId, {
                      manualTakenAt: event.target.value,
                    })
                  }
                  disabled={locked}
                  className="h-9"
                />
              </div>

              {/* Remove */}
              <div className="flex items-start justify-end">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemove(item.clientId)}
                  disabled={locked}
                  aria-label="Remove from queue"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function StatusPill({ item }: { item: UploadItem }) {
  if (item.status === "uploading") {
    return (
      <Badge variant="secondary" className="shrink-0">
        <Loader2 className="mr-1 size-3 animate-spin" />
        {Math.round(item.progress)}%
      </Badge>
    );
  }
  if (item.status === "uploaded") {
    return (
      <Badge
        variant="outline"
        className="shrink-0 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
      >
        <CheckCircle2 className="mr-1 size-3" />
        Uploaded
      </Badge>
    );
  }
  if (item.status === "failed") {
    return (
      <Badge variant="destructive" className="shrink-0">
        <XCircle className="mr-1 size-3" />
        Failed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="shrink-0">
      Ready
    </Badge>
  );
}

function formatPhotoDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
