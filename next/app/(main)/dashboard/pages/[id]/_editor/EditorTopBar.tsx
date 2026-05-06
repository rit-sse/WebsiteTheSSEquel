"use client";

import Link from "next/link";
import {
  Check,
  ChevronLeft,
  ExternalLink,
  Loader2,
  Lock,
  Monitor,
  Save,
  Settings,
  Smartphone,
  Tablet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InlineText } from "./InlineText";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type SaveState = "idle" | "saving" | "saved" | "error";
export type Viewport = "desktop" | "tablet" | "mobile";

interface Props {
  title: string;
  slug: string;
  status: Status;
  systemLocked: boolean;
  saveState: SaveState;
  viewport: Viewport;
  publishing: boolean;
  isLocked: boolean;
  onTitleChange: (next: string) => void;
  onViewportChange: (v: Viewport) => void;
  onOpenSettings: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
}

export function EditorTopBar({
  title,
  slug,
  status,
  systemLocked,
  saveState,
  viewport,
  publishing,
  isLocked,
  onTitleChange,
  onViewportChange,
  onOpenSettings,
  onPublish,
  onUnpublish,
}: Props) {
  return (
    <div className="sticky top-[4.5rem] z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex w-full max-w-[100rem] flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-4">
        {/* Left cluster: back, title, slug, badges */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link
            href="/dashboard/pages"
            className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-1 hover:text-foreground"
            aria-label="Back to pages"
            title="Back to pages"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <InlineText
              as="h1"
              value={title}
              onCommit={onTitleChange}
              ariaLabel="Page title"
              singleLine
              editOnClick
              disabled={isLocked}
              className="min-w-0 max-w-[14rem] truncate font-display text-base font-semibold tracking-tight sm:max-w-[20rem] md:text-lg"
            />
            <span className="hidden min-w-0 truncate font-mono text-[11px] text-muted-foreground sm:inline">
              /{slug}
            </span>
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:ml-0">
              {systemLocked && (
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <Lock className="h-2.5 w-2.5" />
                  Locked
                </Badge>
              )}
              <StatusBadge status={status} />
            </div>
          </div>
        </div>

        {/* Right cluster: save indicator, viewport, action buttons */}
        <div className="flex shrink-0 items-center gap-1.5">
          <SaveIndicator state={saveState} />
          <ViewportSwitcher value={viewport} onChange={onViewportChange} />
          <div className="hidden h-5 w-px bg-border/60 sm:block" />
          <Link
            href={`/${slug}?preview=1`}
            target="_blank"
            className="shrink-0"
          >
            <Button variant="neutral" size="sm" className="h-8 px-2.5">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="ml-1.5 hidden md:inline">Preview</span>
            </Button>
          </Link>
          <Button
            variant="neutral"
            size="sm"
            onClick={onOpenSettings}
            className="h-8 px-2.5 shrink-0"
            title="Page settings"
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="ml-1.5 hidden md:inline">Settings</span>
          </Button>
          {status === "PUBLISHED" ? (
            <>
              <Button
                variant="neutral"
                size="sm"
                onClick={onUnpublish}
                disabled={isLocked}
                className="h-8 shrink-0 px-2.5 text-xs"
              >
                Unpublish
              </Button>
              <Button
                size="sm"
                onClick={onPublish}
                disabled={publishing || isLocked}
                className="h-8 shrink-0 px-3"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Publishing…
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Republish
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={onPublish}
              disabled={publishing || isLocked}
              className="h-8 shrink-0 px-3"
            >
              {publishing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Publishing…
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Publish
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "PUBLISHED") {
    return <Badge className="bg-categorical-green text-foreground">Live</Badge>;
  }
  if (status === "DRAFT") {
    return <Badge variant="secondary">Draft</Badge>;
  }
  return <Badge variant="outline">Archived</Badge>;
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-categorical-green">
        <Check className="h-3 w-3" />
        Saved
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="text-xs font-medium text-destructive">Save failed</span>
    );
  }
  return null;
}

function ViewportSwitcher({
  value,
  onChange,
}: {
  value: Viewport;
  onChange: (v: Viewport) => void;
}) {
  const items: { id: Viewport; label: string; icon: React.ReactNode }[] = [
    { id: "desktop", label: "Desktop", icon: <Monitor className="h-3.5 w-3.5" /> },
    { id: "tablet", label: "Tablet", icon: <Tablet className="h-3.5 w-3.5" /> },
    { id: "mobile", label: "Mobile", icon: <Smartphone className="h-3.5 w-3.5" /> },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onChange(it.id)}
          aria-label={`${it.label} preview`}
          title={`${it.label} preview`}
          className={cn(
            "rounded-sm p-1.5 transition-colors",
            value === it.id
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:bg-surface-1 hover:text-foreground",
          )}
        >
          {it.icon}
        </button>
      ))}
    </div>
  );
}
