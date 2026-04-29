import * as React from "react";
import {
  Receipt,
  QrCode,
  ClipboardList,
  GraduationCap,
  Megaphone,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardSectionId } from "@/lib/dashboardSections";

interface SectionPreviewProps {
  id: DashboardSectionId;
  /** Tailwind text-color class (e.g. `text-primary`) supplied by the section config. */
  accentClass: string;
  /**
   * When true, the Mentoring preview surfaces a small unread-availability dot
   * in its top-right corner. Mirrors the navbar's old indicator.
   */
  showRedDot?: boolean;
}

const PREVIEW_WRAPPER = cn(
  "relative h-32 w-full overflow-hidden rounded-lg",
  "bg-surface-2",
  "neo:border neo:border-black/15",
  "clean:border clean:border-border/20",
  "p-3"
);

/**
 * Stylized illustrative previews for each Officer Dashboard card.
 *
 * Intentionally lo-fi — these are decorative placeholders that *suggest* the
 * shape of the destination page (a list of receipts, a grid of photos, etc.)
 * without rendering any real data. Built from divs + lucide icons so they
 * stay cheap to render and don't need extra assets.
 */
export default function SectionPreview({
  id,
  accentClass,
  showRedDot = false,
}: SectionPreviewProps) {
  switch (id) {
    case "purchasing":
      return (
        <div className={PREVIEW_WRAPPER}>
          <div className="absolute right-2 top-2 flex items-center gap-1">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full font-bold text-xs",
                "bg-current/10",
                accentClass
              )}
              aria-hidden
            >
              $
            </span>
            <Receipt className={cn("h-5 w-5", accentClass)} aria-hidden />
          </div>
          <div className="flex h-full flex-col justify-center gap-1.5 pr-14">
            <div className="h-2 w-3/4 rounded-sm bg-foreground/30" />
            <div className="h-2 w-2/3 rounded-sm bg-foreground/20" />
            <div className="h-2 w-1/2 rounded-sm bg-foreground/15" />
          </div>
        </div>
      );

    case "attendance":
      return (
        <div className={PREVIEW_WRAPPER}>
          <QrCode
            className={cn("absolute right-2 top-2 h-6 w-6", accentClass)}
            aria-hidden
          />
          <div className="flex h-full flex-col justify-center gap-2 pr-10">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((dot) => (
                  <div
                    key={dot}
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      (row + dot) % 3 === 0
                        ? cn("bg-current", accentClass)
                        : "bg-foreground/20"
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      );

    case "mentoring": {
      // 4 rows × 7 cols grid; highlight a couple cells in the accent color.
      const HIGHLIGHTS = new Set([6, 16]);
      return (
        <div className={PREVIEW_WRAPPER}>
          {showRedDot && (
            <span
              className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-destructive"
              aria-label="New mentor availability"
            />
          )}
          <div className="grid h-full grid-cols-7 grid-rows-4 gap-1.5">
            {Array.from({ length: 28 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-sm",
                  HIGHLIGHTS.has(i)
                    ? cn("bg-current", accentClass)
                    : "bg-foreground/15"
                )}
              />
            ))}
          </div>
        </div>
      );
    }

    case "tech-committee":
      return (
        <div className={PREVIEW_WRAPPER}>
          <div className="absolute right-2 top-2 flex items-center gap-1.5">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                "bg-current/10",
                accentClass
              )}
            >
              Pending
            </span>
            <ClipboardList
              className={cn("h-5 w-5", accentClass)}
              aria-hidden
            />
          </div>
          <div className="flex h-full flex-col justify-center gap-2 pr-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-2"
                style={{ opacity: 1 - i * 0.18 }}
              >
                <div className="h-4 w-4 rounded-full bg-foreground/20" />
                <div className="h-2 flex-1 rounded-sm bg-foreground/25" />
                <div className="h-2 w-8 rounded-sm bg-foreground/20" />
              </div>
            ))}
          </div>
        </div>
      );

    case "positions":
      return (
        <div className={PREVIEW_WRAPPER}>
          <div className="grid h-full grid-cols-2 gap-2">
            {[0, 1].map((col) => (
              <div key={col} className="flex flex-col justify-center gap-1.5">
                {[0, 1, 2].map((row) => (
                  <div
                    key={row}
                    className={cn(
                      "h-4 w-full rounded-full",
                      (col + row) % 2 === 0
                        ? cn("bg-current/30", accentClass)
                        : "bg-foreground/15"
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      );

    case "users":
      return (
        <div className={PREVIEW_WRAPPER}>
          <div className="flex h-full flex-col justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-6 w-6 shrink-0 rounded-full",
                    i === 1
                      ? cn("bg-current/40", accentClass)
                      : "bg-foreground/20"
                  )}
                />
                <div className="flex flex-1 flex-col gap-1">
                  <div className="h-2 w-2/3 rounded-sm bg-foreground/30" />
                  <div className="h-1.5 w-1/2 rounded-sm bg-foreground/15" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "sponsors":
      return (
        <div className={PREVIEW_WRAPPER}>
          <div className="flex h-full items-center justify-around gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "flex h-14 flex-1 items-center justify-center rounded-md",
                  i === 1
                    ? cn("bg-current/15 border-current/40", accentClass)
                    : "bg-foreground/10 border-foreground/20",
                  "border"
                )}
              >
                <div
                  className={cn(
                    "h-1.5 w-3/4 rounded-sm",
                    i === 1
                      ? cn("bg-current", accentClass)
                      : "bg-foreground/30"
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      );

    case "alumni":
      return (
        <div className={PREVIEW_WRAPPER}>
          <GraduationCap
            className={cn("absolute right-2 top-2 h-6 w-6", accentClass)}
            aria-hidden
          />
          <div className="flex h-full flex-col justify-center gap-2 pr-10">
            {[
              { ok: true },
              { ok: false },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-foreground/20" />
                <div className="h-2 flex-1 rounded-sm bg-foreground/25" />
                {row.ok ? (
                  <Check
                    className={cn("h-4 w-4", accentClass)}
                    aria-hidden
                  />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" aria-hidden />
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case "elections": {
      // Vote-tally bars; heights chosen to look like a real result chart.
      const BARS = [60, 90, 45, 75];
      return (
        <div className={PREVIEW_WRAPPER}>
          <div className="flex h-full items-end justify-around gap-2 pb-1">
            {BARS.map((h, i) => (
              <div
                key={i}
                className={cn(
                  "w-6 rounded-t-sm",
                  i === 1
                    ? cn("bg-current", accentClass)
                    : "bg-foreground/25"
                )}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      );
    }

    case "announcements":
      return (
        <div className={cn(PREVIEW_WRAPPER, "flex items-center justify-center")}>
          <div className="relative">
            <Megaphone
              className={cn("relative z-10 h-10 w-10", accentClass)}
              aria-hidden
            />
            <span
              className={cn(
                "absolute -right-3 top-1 h-6 w-6 rounded-full border-2 opacity-60",
                "border-current",
                accentClass
              )}
              aria-hidden
            />
            <span
              className={cn(
                "absolute -right-6 -top-1 h-10 w-10 rounded-full border-2 opacity-30",
                "border-current",
                accentClass
              )}
              aria-hidden
            />
          </div>
        </div>
      );

    case "photos":
      return (
        <div className={PREVIEW_WRAPPER}>
          <div className="grid h-full grid-cols-3 grid-rows-2 gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-sm",
                  i === 2 || i === 3
                    ? cn("bg-current/30", accentClass)
                    : "bg-foreground/15"
                )}
              />
            ))}
          </div>
        </div>
      );

    default: {
      // Exhaustiveness check — TypeScript will flag any new ID that lacks a case.
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}
