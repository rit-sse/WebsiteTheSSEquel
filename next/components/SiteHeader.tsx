"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { ActiveElectionSummary } from "@/lib/elections";
import type { SiteBanner } from "@/lib/siteBanners";
import Navbar from "@/components/nav/Navbar";
import SiteBannerList from "@/components/SiteBannerList";

const HEADER_CONTENT_GUTTER_PX = 12;

type SiteHeaderProps = {
  serverUserId?: number | null;
  serverShowDashboard?: boolean;
  serverProfileComplete?: boolean;
  serverActiveElection?: ActiveElectionSummary | null;
  serverCommitteeHeadNominationsOpen?: boolean;
  banners: SiteBanner[];
};

export default function SiteHeader({
  serverUserId,
  serverShowDashboard,
  serverProfileComplete,
  serverActiveElection,
  serverCommitteeHeadNominationsOpen,
  banners,
}: SiteHeaderProps) {
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateHeight = () => {
      setHeaderHeight(Math.ceil(header.getBoundingClientRect().height));
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className="fixed left-0 top-0 z-50 w-screen bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <Navbar
          serverUserId={serverUserId}
          serverShowDashboard={serverShowDashboard}
          serverProfileComplete={serverProfileComplete}
          serverActiveElection={serverActiveElection}
          serverCommitteeHeadNominationsOpen={serverCommitteeHeadNominationsOpen}
        />
        <SiteBannerList banners={banners} />
      </header>
      <div
        aria-hidden="true"
        className={banners.length > 0 ? "h-36 lg:h-40" : "h-24"}
        style={
          headerHeight == null
            ? undefined
            : { height: headerHeight + HEADER_CONTENT_GUTTER_PX }
        }
      />
    </>
  );
}
