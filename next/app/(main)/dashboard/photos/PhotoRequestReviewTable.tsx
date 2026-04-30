"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import type { DashboardPhotoEvent } from "./DashboardPhotosClient";

export type PhotoUploadRequestDto = {
  id: number;
  imageUrl: string;
  caption: string | null;
  altText: string | null;
  category: string;
  eventId?: string | null;
  event: DashboardPhotoEvent | null;
  photoDate: string | null;
  uploadedAt: string;
  originalFilename: string;
  originalMimeType: string;
  originalSizeBytes: number;
  submitterName: string | null;
  submitterEmail: string | null;
  submitterNote: string | null;
  status: string;
};

export function PhotoRequestReviewTable({
  requests,
  events,
  categories,
  onChange,
}: {
  requests: PhotoUploadRequestDto[];
  events: DashboardPhotoEvent[];
  categories: string[];
  onChange: () => Promise<void> | void;
}) {
  if (requests.length === 0) {
    return (
      <Card depth={2} className="p-12 text-center">
        <h3 className="font-display text-xl font-semibold">
          No pending requests
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Public photo submissions will appear here for officer review.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold leading-tight">
          Review photo requests
        </h2>
        <p className="text-sm text-muted-foreground">
          Approving publishes a photo to Historians. Rejected uploads remain
          private.
        </p>
      </div>
      <div className="grid gap-4">
        {requests.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            events={events}
            categories={categories}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

function RequestCard({
  request,
  events,
  categories,
  onChange,
}: {
  request: PhotoUploadRequestDto;
  events: DashboardPhotoEvent[];
  categories: string[];
  onChange: () => Promise<void> | void;
}) {
  const [caption, setCaption] = useState(request.caption ?? "");
  const [altText, setAltText] = useState(request.altText ?? "");
  const [category, setCategory] = useState(request.category);
  const [eventId, setEventId] = useState(request.eventId ?? "");
  const [manualTakenAt, setManualTakenAt] = useState(
    toDateInputValue(request.photoDate),
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [busyAction, setBusyAction] = useState<"approve" | "reject" | null>(
    null,
  );

  useEffect(() => {
    setCaption(request.caption ?? "");
    setAltText(request.altText ?? "");
    setCategory(request.category);
    setEventId(request.eventId ?? "");
    setManualTakenAt(toDateInputValue(request.photoDate));
    setReviewNotes("");
  }, [request]);

  async function review(action: "approve" | "reject") {
    setBusyAction(action);
    try {
      const response = await fetch(`/api/photo-upload-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          caption: caption || null,
          altText: altText || null,
          category,
          eventId: eventId || null,
          manualTakenAt: manualTakenAt || null,
          reviewNotes: reviewNotes || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        toast.error(error.error || "Failed to review request");
        return;
      }
      toast.success(
        action === "approve" ? "Photo published" : "Request rejected",
      );
      await onChange();
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <Card depth={2} className="p-4 md:p-5">
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-3">
          <div
            className="relative w-full overflow-hidden rounded-md border border-border/40 bg-black"
            style={{ paddingBottom: "100%" }}
          >
            <Image
              src={request.imageUrl}
              alt={altText || caption || request.originalFilename}
              fill
              className="object-cover"
              sizes="220px"
            />
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p className="truncate" title={request.originalFilename}>
              {request.originalFilename}
            </p>
            <p>
              {(request.originalSizeBytes / (1024 * 1024)).toFixed(1)} MB ·{" "}
              {request.originalMimeType}
            </p>
            <p>Submitted {formatDate(request.uploadedAt)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <Badge variant="outline" className="capitalize">
                {request.status}
              </Badge>
              {(request.submitterName ||
                request.submitterEmail ||
                request.submitterNote) && (
                <div className="text-sm text-muted-foreground">
                  {request.submitterName && <p>{request.submitterName}</p>}
                  {request.submitterEmail && <p>{request.submitterEmail}</p>}
                  {request.submitterNote && <p>{request.submitterNote}</p>}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="neutral"
                disabled={busyAction !== null}
                onClick={() => review("reject")}
              >
                {busyAction === "reject" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <X className="size-4" />
                )}
                Reject
              </Button>
              <Button
                type="button"
                disabled={busyAction !== null}
                onClick={() => review("approve")}
              >
                {busyAction === "approve" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Approve
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`caption-${request.id}`}>Caption</Label>
              <Input
                id={`caption-${request.id}`}
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`date-${request.id}`}>Photo date</Label>
              <Input
                id={`date-${request.id}`}
                type="date"
                value={manualTakenAt}
                onChange={(event) => setManualTakenAt(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`alt-${request.id}`}>Alt text</Label>
            <Textarea
              id={`alt-${request.id}`}
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
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

          <div className="space-y-1.5">
            <Label htmlFor={`notes-${request.id}`}>Review notes</Label>
            <Textarea
              id={`notes-${request.id}`}
              value={reviewNotes}
              onChange={(event) => setReviewNotes(event.target.value)}
              rows={2}
              placeholder="Optional"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function toDateInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
