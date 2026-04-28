"use client";

import { useState } from "react";
import Link from "next/link";
import { Info, Vote, X } from "lucide-react";
import { ElectionStatusBadge } from "@/components/elections/ElectionStatusBadge";
import type { SiteBanner } from "@/lib/siteBanners";

export default function SiteBannerList({ banners }: { banners: SiteBanner[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = banners.filter((banner) => !dismissed.has(banner.id));

  if (visible.length === 0) return null;

  return (
    <div className="mt-20 border-b-[2px] border-black">
      {visible.map((banner, index) => {
        const content = (
          <div
            className={`relative flex items-center justify-center gap-3 px-4 py-2.5 text-sm transition-colors ${
              banner.kind === "election"
                ? "bg-card hover:bg-muted"
                : "bg-primary/10 hover:bg-primary/15"
            } ${index > 0 ? "border-t border-border" : ""}`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-primary">
                {banner.kind === "election" ? (
                  <Vote className="h-4 w-4" />
                ) : (
                  <Info className="h-4 w-4" />
                )}
              </span>
              {banner.category && banner.kind !== "election" && (
                <span className="shrink-0 font-semibold">
                  [{banner.category}]
                </span>
              )}
              <span className="truncate font-medium">{banner.message}</span>
            </span>
            {banner.electionStatus && (
              <ElectionStatusBadge
                status={banner.electionStatus}
                className="hidden sm:inline-flex"
              />
            )}
            {banner.dismissible && (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setDismissed((prev) => new Set(prev).add(banner.id));
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:bg-background/60"
                aria-label="Dismiss announcement"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );

        return banner.href ? (
          <Link key={banner.id} href={banner.href} className="block">
            {content}
          </Link>
        ) : (
          <div key={banner.id}>{content}</div>
        );
      })}
    </div>
  );
}
