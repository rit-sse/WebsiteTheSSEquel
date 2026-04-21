"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Settings, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ElectionStatus } from "@prisma/client";

/**
 * Dev-only floating Tweaks panel. Lives in the bottom-right corner and
 * lets you flip an election through every phase in one click, matching
 * the design handoff's "Tweaks" panel
 * (sse-primary-election-system/project/election/app.jsx L154).
 *
 * Only renders when:
 *   - `process.env.NODE_ENV !== "production"` (Next inlines this at build), and
 *   - (optionally) the user is SE Admin, via the `canAccess` prop.
 *
 * The panel hits `POST /api/elections/[id]/dev-set-status`, which is also
 * gated to non-production + SE Admin. The server-side endpoint shoves the
 * date cutoffs into the past/future as needed so `syncElectionStatus()`
 * doesn't bounce the phase back on the next request.
 */

const PHASES: Array<{ status: ElectionStatus; label: string; short: string }> = [
  { status: "DRAFT", label: "Draft", short: "Draft" },
  { status: "NOMINATIONS_OPEN", label: "Nominations Open", short: "Noms" },
  {
    status: "NOMINATIONS_CLOSED",
    label: "Nominations Closed",
    short: "Accept",
  },
  { status: "VOTING_OPEN", label: "Voting Open", short: "Voting" },
  { status: "VOTING_CLOSED", label: "Voting Closed", short: "Tallied" },
  { status: "CERTIFIED", label: "Certified", short: "Done" },
];

const TERMINAL: Array<{ status: ElectionStatus; label: string }> = [
  { status: "TIE_RUNOFF_REQUIRED", label: "Runoff needed" },
  { status: "CANCELLED", label: "Cancelled" },
];

interface Props {
  electionId: number;
  currentStatus: ElectionStatus;
  /** Only render when true. Caller passes `authLevel.isSeAdmin`. */
  canAccess: boolean;
}

export default function ElectionDevTweaks({
  electionId,
  currentStatus,
  canAccess,
}: Props) {
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  // Gate: only in dev, and only if the caller says this user is allowed.
  const enabled =
    typeof process !== "undefined" &&
    process.env.NODE_ENV !== "production" &&
    canAccess;

  useEffect(() => {
    // Persist the open/closed state so devs don't have to re-open it
    // every time they refresh.
    if (!enabled) return;
    try {
      const saved = window.localStorage.getItem("sse_election_tweaks_open");
      if (saved === "0") setOpen(false);
    } catch {}
  }, [enabled]);

  const setStatus = useCallback(
    async (status: ElectionStatus) => {
      setBusy(status);
      try {
        const response = await fetch(
          `/api/elections/${electionId}/dev-set-status`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          }
        );
        if (!response.ok) {
          toast.error((await response.text()) || `Failed to set ${status}`);
          return;
        }
        toast.success(`Election → ${status}`);
        if (typeof window !== "undefined") window.location.reload();
      } catch {
        toast.error("Dev tweak failed");
      } finally {
        setBusy(null);
      }
    },
    [electionId]
  );

  if (!enabled) return null;

  const persistOpen = (next: boolean) => {
    setOpen(next);
    try {
      window.localStorage.setItem(
        "sse_election_tweaks_open",
        next ? "1" : "0"
      );
    } catch {}
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => persistOpen(true)}
        aria-label="Open election tweaks"
        className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border-2 border-black bg-primary text-primary-foreground shadow-[4px_4px_0_0_black] hover:shadow-[6px_6px_0_0_black] transition-shadow"
      >
        <Settings className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Election tweaks (dev only)"
      className="fixed bottom-4 right-4 z-50 w-[320px] max-h-[calc(100vh-32px)] overflow-auto rounded-[14px] border-2 border-black bg-card shadow-[4px_4px_0_0_black]"
    >
      <div className="flex items-center justify-between gap-2 border-b border-black/30 p-3">
        <div className="flex items-center gap-2 font-display font-bold text-sm">
          <Settings className="h-4 w-4" />
          Tweaks
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            dev
          </span>
        </div>
        <button
          type="button"
          onClick={() => persistOpen(false)}
          aria-label="Close tweaks"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-4 p-3">
        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Election phase
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-black/30 bg-muted p-1">
            {PHASES.slice(0, 3).map((p) => (
              <PhaseButton
                key={p.status}
                label={p.short}
                title={p.label}
                active={currentStatus === p.status}
                busy={busy === p.status}
                onClick={() => setStatus(p.status)}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-black/30 bg-muted p-1">
            {PHASES.slice(3).map((p) => (
              <PhaseButton
                key={p.status}
                label={p.short}
                title={p.label}
                active={currentStatus === p.status}
                busy={busy === p.status}
                onClick={() => setStatus(p.status)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Terminal states
          </div>
          <div className="grid grid-cols-2 gap-1">
            {TERMINAL.map((t) => (
              <button
                key={t.status}
                type="button"
                onClick={() => setStatus(t.status)}
                disabled={busy !== null}
                className={cn(
                  "rounded-md border border-black/30 bg-muted px-2 py-1.5 text-xs font-semibold transition-colors",
                  currentStatus === t.status &&
                    "border-destructive bg-destructive/10 text-destructive",
                  busy !== null && "opacity-60"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-black/20 pt-3 text-xs text-muted-foreground">
          <span>
            Current:{" "}
            <strong className="text-foreground font-semibold">
              {currentStatus}
            </strong>
          </span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Reload
          </button>
        </div>
      </div>
    </div>
  );
}

function PhaseButton({
  label,
  title,
  active,
  busy,
  onClick,
}: {
  label: string;
  title: string;
  active: boolean;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={busy}
      className={cn(
        "rounded-md px-2 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-[inset_0_0_0_1px_black]"
          : "text-foreground hover:bg-muted-foreground/10",
        busy && "opacity-60"
      )}
    >
      {label}
    </button>
  );
}
