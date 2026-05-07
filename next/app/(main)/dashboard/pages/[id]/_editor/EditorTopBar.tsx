"use client";

/**
 * Editor top bar.
 *
 * Modern flat / shadcn-style buttons (ghost for secondary, solid primary
 * for the single accent action — Publish). No neo-brutalist shadows in
 * the editor chrome itself; the canvas below renders the public site
 * with whatever theme the user has set.
 */
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
    <div className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-3 py-2 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Link
          href="/dashboard/pages"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Back to pages"
          title="Back to pages"
        >
          <ChevronLeft className="size-4" />
        </Link>

        <InlineText
          as="h1"
          value={title}
          onCommit={onTitleChange}
          ariaLabel="Page title"
          singleLine
          editOnClick
          disabled={isLocked}
          className="min-w-0 max-w-[14rem] truncate font-display text-base font-semibold tracking-tight sm:max-w-[22rem] md:text-[17px]"
        />
        <span className="hidden min-w-0 truncate font-mono text-[11px] text-muted-foreground sm:inline">
          /{slug}
        </span>
        <StatusPill status={status} systemLocked={systemLocked} />
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <SaveIndicator state={saveState} />
        <ViewportSwitcher value={viewport} onChange={onViewportChange} />
        <span className="hidden h-5 w-px bg-border sm:block" />
        <Link href={`/${slug}?preview=1`} target="_blank">
          <GhostButton title="Open public preview in new tab">
            <ExternalLink className="size-3.5" />
            <span className="hidden md:inline">Preview</span>
          </GhostButton>
        </Link>
        <GhostButton onClick={onOpenSettings} title="Page settings">
          <Settings className="size-3.5" />
          <span className="hidden md:inline">Settings</span>
        </GhostButton>
        {status === "PUBLISHED" ? (
          <>
            <GhostButton onClick={onUnpublish} disabled={isLocked}>
              Unpublish
            </GhostButton>
            <PrimaryButton
              onClick={onPublish}
              disabled={publishing || isLocked}
            >
              {publishing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Publishing…
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  Republish
                </>
              )}
            </PrimaryButton>
          </>
        ) : (
          <PrimaryButton onClick={onPublish} disabled={publishing || isLocked}>
            {publishing ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                Publish
              </>
            )}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}

// ── Buttons ──

const buttonBase =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

function GhostButton({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        buttonBase,
        "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        buttonBase,
        "bg-foreground px-3 text-background hover:bg-foreground/90 shadow-sm",
      )}
    >
      {children}
    </button>
  );
}

// ── Indicators ──

function StatusPill({
  status,
  systemLocked,
}: {
  status: Status;
  systemLocked: boolean;
}) {
  if (systemLocked) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        <Lock className="size-2.5" />
        Locked
      </span>
    );
  }
  if (status === "PUBLISHED") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-categorical-green/15 px-2 py-0.5 text-[11px] font-medium text-foreground">
        <span className="size-1.5 rounded-full bg-categorical-green" />
        Live
      </span>
    );
  }
  if (status === "DRAFT") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-categorical-orange/15 px-2 py-0.5 text-[11px] font-medium text-foreground">
        <span className="size-1.5 rounded-full bg-categorical-orange" />
        Draft
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      Archived
    </span>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "saving") {
    return (
      <span className="hidden items-center gap-1.5 px-1 text-[11px] text-muted-foreground sm:inline-flex">
        <Loader2 className="size-3 animate-spin" />
        Saving
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="hidden items-center gap-1.5 px-1 text-[11px] text-categorical-green sm:inline-flex">
        <Check className="size-3" />
        Saved
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="hidden px-1 text-[11px] font-medium text-destructive sm:inline">
        Save failed
      </span>
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
    { id: "desktop", label: "Desktop", icon: <Monitor className="size-3.5" /> },
    { id: "tablet", label: "Tablet", icon: <Tablet className="size-3.5" /> },
    { id: "mobile", label: "Mobile", icon: <Smartphone className="size-3.5" /> },
  ];
  return (
    <div className="inline-flex items-center rounded-md bg-muted p-0.5">
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
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {it.icon}
        </button>
      ))}
    </div>
  );
}
