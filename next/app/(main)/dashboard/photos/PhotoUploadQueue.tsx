"use client";

import Image from "next/image";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UploadItem = {
  clientId: string;
  file: File;
  previewUrl: string;
  exifTakenAt: string | null;
  manualTakenAt: string;
  caption: string;
  status: "ready" | "uploading" | "uploaded" | "failed";
  error?: string;
};

export function PhotoUploadQueue({
  items,
  onChange,
}: {
  items: UploadItem[];
  onChange: (clientId: string, patch: Partial<UploadItem>) => void;
}) {
  return (
    <div className="max-h-[560px] space-y-3 overflow-auto pr-1">
      {items.map((item) => (
        <div
          key={item.clientId}
          className="grid gap-3 rounded-md border border-border/50 bg-background p-3 md:grid-cols-[72px_1fr_170px]"
        >
          <div className="relative aspect-square overflow-hidden rounded-md border border-border">
            <Image
              src={item.previewUrl}
              alt={item.file.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{item.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                  {item.exifTakenAt
                    ? ` • EXIF ${formatPhotoDate(item.exifTakenAt)}`
                    : " • no EXIF date"}
                </p>
              </div>
              <Status status={item.status} />
            </div>
            <Input
              value={item.caption}
              onChange={(event) =>
                onChange(item.clientId, { caption: event.target.value })
              }
              placeholder="Caption"
              disabled={item.status === "uploading"}
            />
            {item.error && (
              <p className="text-sm text-destructive">{item.error}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Override date</Label>
            <Input
              type="date"
              value={item.manualTakenAt}
              onChange={(event) =>
                onChange(item.clientId, { manualTakenAt: event.target.value })
              }
              disabled={item.status === "uploading"}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Status({ status }: { status: UploadItem["status"] }) {
  if (status === "uploading") {
    return <Loader2 className="size-5 animate-spin text-muted-foreground" />;
  }
  if (status === "uploaded") {
    return <CheckCircle2 className="size-5 text-green-600" />;
  }
  if (status === "failed") {
    return <XCircle className="size-5 text-destructive" />;
  }
  return <span className="text-xs text-muted-foreground">Ready</span>;
}

function formatPhotoDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
