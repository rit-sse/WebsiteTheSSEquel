import * as React from "react";
import {
  Receipt,
  QrCode,
  Link2,
  ClipboardList,
  GraduationCap,
  Megaphone,
  FileText,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardSectionId } from "@/lib/dashboardSections";
import type {
  AlumniSummary,
  AnnouncementsSummary,
  AttendanceSummary,
  CommitteeHeadNominationsSummary,
  DashboardSummary,
  ElectionsSummary,
  GoLinksSummary,
  MentoringSummary,
  PagesSummary,
  PhotosSummary,
  PositionsSummary,
  PurchasingSummary,
  SponsorsSummary,
  TechCommitteeSummary,
  UsersSummary,
} from "@/lib/dashboardSummary";

interface SectionPreviewProps {
  id: DashboardSectionId;
  /** Tailwind text-color class (e.g. `text-primary`) supplied by the section config. */
  accentClass: string;
  /**
   * When true, the Mentoring preview surfaces a small unread-availability dot
   * in its top-right corner. Mirrors the navbar's old indicator.
   */
  showRedDot?: boolean;
  /**
   * Optional live-data slice for this section. The caller looks the right
   * shape up via `summary[section.id]`; each preview narrows it back with a
   * type guard so it can render real numbers / titles / thumbnails.
   */
  data?: DashboardSummary[DashboardSectionId];
}

const PREVIEW_WRAPPER = cn(
  "relative h-32 w-full overflow-hidden rounded-lg",
  "bg-surface-2",
  "neo:border neo:border-black/15",
  "clean:border clean:border-border/20",
  "p-3",
);

/**
 * Stylized illustrative previews for each Officer Dashboard card.
 *
 * Each preview combines a lightweight visual (lucide icon + Tailwind shapes)
 * with whatever live data is available for that section — counts, recent row
 * titles, sponsor names, photo thumbnails, etc. When `data` is omitted the
 * previews render their pure-decorative fallback so they still look right
 * during loading or when a query failed.
 */
export default function SectionPreview({
  id,
  accentClass,
  showRedDot = false,
  data,
}: SectionPreviewProps) {
  switch (id) {
    case "purchasing":
      return (
        <PurchasingPreview
          accentClass={accentClass}
          data={data as PurchasingSummary | undefined}
        />
      );
    case "attendance":
      return (
        <AttendancePreview
          accentClass={accentClass}
          data={data as AttendanceSummary | undefined}
        />
      );
    case "go-links":
      return (
        <GoLinksPreview
          accentClass={accentClass}
          data={data as GoLinksSummary | undefined}
        />
      );
    case "mentoring":
      return (
        <MentoringPreview
          accentClass={accentClass}
          showRedDot={showRedDot}
          data={data as MentoringSummary | undefined}
        />
      );
    case "tech-committee":
      return (
        <TechCommitteePreview
          accentClass={accentClass}
          data={data as TechCommitteeSummary | undefined}
        />
      );
    case "committee-head-nominations":
      return (
        <TechCommitteePreview
          accentClass={accentClass}
          data={data as CommitteeHeadNominationsSummary | undefined}
        />
      );
    case "positions":
      return (
        <PositionsPreview
          accentClass={accentClass}
          data={data as PositionsSummary | undefined}
        />
      );
    case "users":
      return (
        <UsersPreview
          accentClass={accentClass}
          data={data as UsersSummary | undefined}
        />
      );
    case "sponsors":
      return (
        <SponsorsPreview
          accentClass={accentClass}
          data={data as SponsorsSummary | undefined}
        />
      );
    case "alumni":
      return (
        <AlumniPreview
          accentClass={accentClass}
          data={data as AlumniSummary | undefined}
        />
      );
    case "elections":
      return (
        <ElectionsPreview
          accentClass={accentClass}
          data={data as ElectionsSummary | undefined}
        />
      );
    case "announcements":
      return (
        <AnnouncementsPreview
          accentClass={accentClass}
          data={data as AnnouncementsSummary | undefined}
        />
      );
    case "photos":
      return (
        <PhotosPreview
          accentClass={accentClass}
          data={data as PhotosSummary | undefined}
        />
      );
    case "pages":
      return (
        <PagesPreview
          accentClass={accentClass}
          data={data as PagesSummary | undefined}
        />
      );
    default: {
      // Exhaustiveness check — TypeScript will flag any new ID that lacks a case.
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

/* ─────────────────────── per-section previews ─────────────────────── */

function PurchasingPreview({
  accentClass,
  data,
}: {
  accentClass: string;
  data?: PurchasingSummary;
}) {
  // Each row in the receipt list either shows a real description or falls
  // back to a neutral grey bar so the layout stays consistent at zero rows.
  const rows = data?.recent ?? [];
  return (
    <div className={PREVIEW_WRAPPER}>
      <div className="absolute right-2 top-2 flex items-center gap-1.5">
        {data && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              "bg-current/10",
              accentClass,
            )}
          >
            {data.pendingCount} pending
          </span>
        )}
        <Receipt className={cn("h-5 w-5", accentClass)} aria-hidden />
      </div>
      <div className="flex h-full flex-col justify-center gap-1.5 pr-24">
        {[0, 1, 2].map((i) => {
          const row = rows[i];
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  row?.status === "pending"
                    ? cn("bg-current", accentClass)
                    : "bg-foreground/25",
                )}
              />
              {row ? (
                <span className="truncate text-xs text-muted-foreground">
                  {row.description}
                </span>
              ) : (
                <div
                  className="h-2 rounded-sm bg-foreground/15"
                  style={{ width: `${72 - i * 12}%` }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AttendancePreview({
  accentClass,
  data,
}: {
  accentClass: string;
  data?: AttendanceSummary;
}) {
  const rows = data?.recent ?? [];
  return (
    <div className={PREVIEW_WRAPPER}>
      <QrCode
        className={cn("absolute right-2 top-2 h-5 w-5", accentClass)}
        aria-hidden
      />
      <div className="flex h-full flex-col justify-center gap-1.5 pr-8">
        {rows.length === 0
          ? // Fallback: dot grid placeholder.
            [0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((dot) => (
                  <div
                    key={dot}
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      (row + dot) % 3 === 0
                        ? cn("bg-current", accentClass)
                        : "bg-foreground/20",
                    )}
                  />
                ))}
              </div>
            ))
          : rows.map((event) => (
              <div key={event.id} className="flex items-center gap-2 text-xs">
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                    "bg-current/15",
                    accentClass,
                  )}
                >
                  {event.attendeeCount}
                </span>
                <span className="truncate text-muted-foreground">
                  {event.title}
                </span>
              </div>
            ))}
      </div>
    </div>
  );
}

function GoLinksPreview({
  accentClass,
  data,
}: {
  accentClass: string;
  data?: GoLinksSummary;
}) {
  const rows = data?.recent ?? [];
  return (
    <div className={PREVIEW_WRAPPER}>
      <div className="absolute right-2 top-2 flex items-center gap-1.5">
        {data && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              "bg-current/10",
              accentClass,
            )}
          >
            {data.pinnedCount} pinned
          </span>
        )}
        <Link2 className={cn("h-5 w-5", accentClass)} aria-hidden />
      </div>
      <div className="flex h-full flex-col justify-center gap-1.5 pr-20">
        {rows.length > 0 ? (
          rows.map((link) => (
            <div key={link.id} className="flex items-center gap-2 text-xs">
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  link.isPinned
                    ? cn("bg-current", accentClass)
                    : "bg-foreground/25",
                )}
              />
              <span className="truncate font-mono text-muted-foreground">
                /go/{link.golink}
              </span>
              {!link.isPublic && (
                <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  officer
                </span>
              )}
            </div>
          ))
        ) : data ? (
          <div className="grid grid-cols-2 gap-3">
            <Stat
              value={data.publicCount}
              label="public"
              accentClass={accentClass}
            />
            <Stat
              value={data.officerCount}
              label="officer"
              accentClass={accentClass}
              muted
            />
          </div>
        ) : (
          [0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  i === 0 ? cn("bg-current", accentClass) : "bg-foreground/25",
                )}
              />
              <div
                className="h-2 rounded-sm bg-foreground/20"
                style={{ width: `${70 - i * 10}%` }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MentoringPreview({
  accentClass,
  showRedDot,
  data,
}: {
  accentClass: string;
  showRedDot: boolean;
  data?: MentoringSummary;
}) {
  // 4 rows × 7 cols grid; highlight a couple cells in the accent color.
  const HIGHLIGHTS = new Set([6, 16]);
  return (
    <div className={PREVIEW_WRAPPER}>
      {showRedDot && (
        <span
          className="absolute right-2 top-2 z-10 h-2.5 w-2.5 rounded-full bg-destructive"
          aria-label="New mentor availability"
        />
      )}
      {data && (
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-0.5 text-[10px] leading-tight">
          <span className={cn("font-bold", accentClass)}>
            {data.activeMentorCount} active
          </span>
          <span className="text-muted-foreground">
            {data.scheduleBlockCount} slots
          </span>
        </div>
      )}
      <div className="grid h-full grid-cols-7 grid-rows-4 gap-1.5">
        {Array.from({ length: 28 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-sm",
              HIGHLIGHTS.has(i)
                ? cn("bg-current", accentClass)
                : "bg-foreground/15",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function TechCommitteePreview({
  accentClass,
  data,
}: {
  accentClass: string;
  data?: TechCommitteeSummary;
}) {
  return (
    <div className={PREVIEW_WRAPPER}>
      <div className="absolute right-2 top-2 flex items-center gap-1.5">
        {data && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              "bg-current/10",
              accentClass,
            )}
          >
            {data.pendingCount} pending
          </span>
        )}
        <ClipboardList className={cn("h-5 w-5", accentClass)} aria-hidden />
      </div>
      <div className="flex h-full flex-col justify-center gap-2 pr-2">
        {data ? (
          <>
            <div className="flex items-baseline gap-2">
              <span
                className={cn("font-display text-2xl font-bold", accentClass)}
              >
                {data.totalCount}
              </span>
              <span className="text-xs text-muted-foreground">
                total applications
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/15">
                <div
                  className={cn("h-full bg-current", accentClass)}
                  style={{
                    width: `${
                      data.totalCount === 0
                        ? 0
                        : Math.round(
                            (data.pendingCount / data.totalCount) * 100,
                          )
                    }%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {data.totalCount === 0
                  ? "—"
                  : `${Math.round(
                      (data.pendingCount / data.totalCount) * 100,
                    )}%`}
              </span>
            </div>
          </>
        ) : (
          [0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2"
              style={{ opacity: 1 - i * 0.18 }}
            >
              <div className="h-4 w-4 rounded-full bg-foreground/20" />
              <div className="h-2 flex-1 rounded-sm bg-foreground/25" />
              <div className="h-2 w-8 rounded-sm bg-foreground/20" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PositionsPreview({
  accentClass,
  data,
}: {
  accentClass: string;
  data?: PositionsSummary;
}) {
  return (
    <div className={PREVIEW_WRAPPER}>
      {data ? (
        <div className="grid h-full grid-cols-2 gap-3">
          <Stat
            value={data.activeOfficerCount}
            label="active officers"
            accentClass={accentClass}
          />
          <Stat
            value={data.vacantPositionCount}
            label={
              data.vacantPositionCount === 1 ? "vacant seat" : "vacant seats"
            }
            accentClass={
              data.vacantPositionCount > 0 ? "text-destructive" : accentClass
            }
            muted={data.vacantPositionCount === 0}
          />
        </div>
      ) : (
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
                      : "bg-foreground/15",
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersPreview({
  accentClass,
  data,
}: {
  accentClass: string;
  data?: UsersSummary;
}) {
  return (
    <div className={PREVIEW_WRAPPER}>
      {data ? (
        <div className="grid h-full grid-cols-2 gap-3">
          <Stat
            value={data.totalUsers}
            label="total users"
            accentClass={accentClass}
          />
          <Stat
            value={data.activeMembers}
            label="members"
            accentClass={accentClass}
            muted
          />
        </div>
      ) : (
        <div className="flex h-full flex-col justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={cn(
                  "h-6 w-6 shrink-0 rounded-full",
                  i === 1
                    ? cn("bg-current/40", accentClass)
                    : "bg-foreground/20",
                )}
              />
              <div className="flex flex-1 flex-col gap-1">
                <div className="h-2 w-2/3 rounded-sm bg-foreground/30" />
                <div className="h-1.5 w-1/2 rounded-sm bg-foreground/15" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SponsorsPreview({
  accentClass,
  data,
}: {
  accentClass: string;
  data?: SponsorsSummary;
}) {
  const slots = [0, 1, 2].map((i) => data?.recent[i]);
  return (
    <div className={PREVIEW_WRAPPER}>
      <div className="flex h-full items-center justify-around gap-2">
        {slots.map((sponsor, i) => (
          <div
            key={i}
            className={cn(
              "flex h-14 flex-1 items-center justify-center rounded-md border px-2",
              sponsor || i === 1
                ? cn("bg-current/15 border-current/40", accentClass)
                : "bg-foreground/10 border-foreground/20",
            )}
          >
            {sponsor ? (
              <span
                className={cn(
                  "truncate font-display text-xs font-bold",
                  accentClass,
                )}
              >
                {sponsor.name}
              </span>
            ) : (
              <div
                className={cn(
                  "h-1.5 w-3/4 rounded-sm",
                  i === 1 ? cn("bg-current", accentClass) : "bg-foreground/30",
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AlumniPreview({
  accentClass,
  data,
}: {
  accentClass: string;
  data?: AlumniSummary;
}) {
  return (
    <div className={PREVIEW_WRAPPER}>
      <GraduationCap
        className={cn("absolute right-2 top-2 h-5 w-5", accentClass)}
        aria-hidden
      />
      {data ? (
        <div className="flex h-full flex-col justify-center gap-2 pr-8">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-foreground/20" />
            <div className="flex-1">
              <div className="text-xs font-semibold">
                {data.pendingRequests} alumni{" "}
                {data.pendingRequests === 1 ? "request" : "requests"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Awaiting review
              </div>
            </div>
            {data.pendingRequests > 0 ? (
              <Check className={cn("h-4 w-4", accentClass)} aria-hidden />
            ) : (
              <X className="h-4 w-4 text-muted-foreground" aria-hidden />
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-foreground/20" />
            <div className="flex-1">
              <div className="text-xs font-semibold">
                {data.pendingCandidates} auto-candidate
                {data.pendingCandidates === 1 ? "" : "s"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Pending approval
              </div>
            </div>
            {data.pendingCandidates > 0 ? (
              <Check className={cn("h-4 w-4", accentClass)} aria-hidden />
            ) : (
              <X className="h-4 w-4 text-muted-foreground" aria-hidden />
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col justify-center gap-2 pr-10">
          {[{ ok: true }, { ok: false }].map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-foreground/20" />
              <div className="h-2 flex-1 rounded-sm bg-foreground/25" />
              {row.ok ? (
                <Check className={cn("h-4 w-4", accentClass)} aria-hidden />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" aria-hidden />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ElectionsPreview({
  accentClass,
  data,
}: {
  accentClass: string;
  data?: ElectionsSummary;
}) {
  // Vote-tally bars; heights chosen to look like a real result chart.
  const BARS = [60, 90, 45, 75];
  return (
    <div className={PREVIEW_WRAPPER}>
      {data && (
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-0.5">
          <span className={cn("text-xs font-bold", accentClass)}>
            {data.liveCount} live
          </span>
          {data.mostRecent && (
            <span className="max-w-[160px] truncate text-[10px] text-muted-foreground">
              {data.mostRecent.title}
            </span>
          )}
        </div>
      )}
      <div className="flex h-full items-end justify-around gap-2 pb-1">
        {BARS.map((h, i) => (
          <div
            key={i}
            className={cn(
              "w-6 rounded-t-sm",
              i === 1 ? cn("bg-current", accentClass) : "bg-foreground/25",
            )}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function AnnouncementsPreview({
  accentClass,
  data,
}: {
  accentClass: string;
  data?: AnnouncementsSummary;
}) {
  return (
    <div className={cn(PREVIEW_WRAPPER, "flex items-center gap-3")}>
      <div className="relative shrink-0">
        <Megaphone
          className={cn("relative z-10 h-10 w-10", accentClass)}
          aria-hidden
        />
        <span
          className={cn(
            "absolute -right-3 top-1 h-6 w-6 rounded-full border-2 opacity-60",
            "border-current",
            accentClass,
          )}
          aria-hidden
        />
        <span
          className={cn(
            "absolute -right-6 -top-1 h-10 w-10 rounded-full border-2 opacity-30",
            "border-current",
            accentClass,
          )}
          aria-hidden
        />
      </div>
      {data && (
        <div className="flex min-w-0 flex-col gap-1">
          <span className={cn("text-xs font-bold", accentClass)}>
            {data.activeCount} active
          </span>
          {data.mostRecent ? (
            <span className="line-clamp-2 text-[11px] leading-tight text-muted-foreground">
              {data.mostRecent.message}
            </span>
          ) : (
            <span className="text-[10px] italic text-muted-foreground">
              No active banners
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function PhotosPreview({
  accentClass,
  data,
}: {
  accentClass: string;
  data?: PhotosSummary;
}) {
  const recent = data?.recent ?? [];
  return (
    <div className={PREVIEW_WRAPPER}>
      {data && (
        <span
          className={cn(
            "absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold",
            "bg-current/15",
            accentClass,
          )}
        >
          {data.totalCount.toLocaleString()} photos
        </span>
      )}
      <div className="grid h-full grid-cols-3 grid-rows-2 gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => {
          const photo = recent[i];
          return (
            <div
              key={i}
              className={cn(
                "relative overflow-hidden rounded-sm",
                photo
                  ? "bg-foreground/10"
                  : i === 2 || i === 3
                    ? cn("bg-current/30", accentClass)
                    : "bg-foreground/15",
              )}
            >
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element -- decorative thumbnail; sized via CSS
                <img
                  src={photo.url}
                  alt={photo.alt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PagesPreview({
  accentClass,
  data,
}: {
  accentClass: string;
  data?: PagesSummary;
}) {
  const rows = data?.recent ?? [];
  return (
    <div className={PREVIEW_WRAPPER}>
      <div className="absolute right-2 top-2 flex items-center gap-1.5">
        {data && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              "bg-current/10",
              accentClass,
            )}
          >
            {data.publishedCount} live
          </span>
        )}
        <FileText className={cn("h-5 w-5", accentClass)} aria-hidden />
      </div>
      <div className="absolute bottom-3 left-3 right-3 top-10 overflow-y-auto pr-8 [scrollbar-gutter:stable]">
        <div className="flex min-h-full flex-col justify-center gap-1.5">
          {rows.length > 0 ? (
            rows.map((page) => (
              <div
                key={page.id}
                className="flex min-w-0 items-center gap-2 text-xs"
              >
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    page.status === "PUBLISHED"
                      ? cn("bg-current", accentClass)
                      : "bg-foreground/25",
                  )}
                />
                <span className="truncate text-muted-foreground">
                  {page.title}
                </span>
              </div>
            ))
          ) : data ? (
            <div className="grid grid-cols-2 gap-3">
              <Stat
                value={data.draftCount}
                label="drafts"
                accentClass={accentClass}
                muted
              />
              <Stat
                value={data.archivedCount}
                label="archived"
                accentClass={accentClass}
                muted
              />
            </div>
          ) : (
            [0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    i === 0
                      ? cn("bg-current", accentClass)
                      : "bg-foreground/25",
                  )}
                />
                <div
                  className="h-2 rounded-sm bg-foreground/20"
                  style={{ width: `${70 - i * 12}%` }}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── shared building blocks ───────────────────────── */

function Stat({
  value,
  label,
  accentClass,
  muted = false,
}: {
  value: number;
  label: string;
  accentClass: string;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 text-center">
      <span
        className={cn(
          "font-display text-2xl font-bold leading-none tabular-nums sm:text-3xl",
          muted ? "text-foreground/70" : accentClass,
        )}
      >
        {value.toLocaleString()}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
