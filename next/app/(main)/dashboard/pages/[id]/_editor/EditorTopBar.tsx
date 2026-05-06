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
      <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/dashboard/pages"
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-surface-1 hover:text-foreground"
            aria-label="Back to pages"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <InlineText
              as="h1"
              value={title}
              onCommit={onTitleChange}
              ariaLabel="Page title"
              singleLine
              editOnClick
              disabled={isLocked}
              className="max-w-[18rem] truncate font-display text-lg font-semibold tracking-tight sm:max-w-md"
            />
            <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">
              /{slug}
            </span>
            {systemLocked && (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-2.5 w-2.5" />
                System-locked
              </Badge>
            )}
            <StatusBadge status={status} />
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 pb-1 lg:ml-auto lg:w-auto lg:flex-nowrap lg:pb-0">
          <SaveIndicator state={saveState} />
          <ViewportSwitcher value={viewport} onChange={onViewportChange} />
          <Link
            href={`/${slug}?preview=1`}
            target="_blank"
            className="shrink-0"
          >
            <Button variant="neutral" size="sm">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Preview
            </Button>
          </Link>
          <Button
            variant="neutral"
            size="sm"
            onClick={onOpenSettings}
            className="shrink-0"
          >
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Settings
          </Button>
          {status === "PUBLISHED" ? (
            <>
              <Button
                variant="neutral"
                size="sm"
                onClick={onUnpublish}
                disabled={isLocked}
                className="shrink-0"
              >
                Unpublish
              </Button>
              <Button
                size="sm"
                onClick={onPublish}
                disabled={publishing || isLocked}
                className="shrink-0"
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
              className="shrink-0"
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
    <div className="hidden items-center gap-0.5 rounded-md border border-border bg-card p-0.5 sm:inline-flex">
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
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {it.icon}
        </button>
      ))}
    </div>
  );
}
