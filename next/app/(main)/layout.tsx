// This file defines the base layout for all main scrolling pages in the application.

import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/Footer";
import ScrollToTopButton from "@/components/nav/ScrollToTopButton";
import { Toaster } from "@/components/ui/sonner";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { getActiveElection } from "@/lib/elections";
import { getSiteBanners } from "@/lib/siteBanners";
import SiteBannerList from "@/components/SiteBannerList";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authLevel, activeElection] = await Promise.all([
    getAuthLevel(),
    getActiveElection(),
  ]);
  const banners = await getSiteBanners(activeElection);

  return (
    <>
      <Navbar
        serverUserId={authLevel.userId}
        serverShowDashboard={
          authLevel.isOfficer || authLevel.isMentor || authLevel.isSeAdmin
        }
        serverProfileComplete={authLevel.profileComplete}
        serverActiveElection={activeElection}
      />
      <SiteBannerList banners={banners} />
      <main
        className={`flex flex-col grow items-center px-2 pb-2 md:px-3 md:pb-3 lg:px-4 lg:pb-4 w-full overflow-x-hidden ${
          banners.length === 0 ? "pt-20 md:pt-20 lg:pt-20" : ""
        }`}
      >
        {children}
      </main>
      <ScrollToTopButton />
      <Footer />
      <Toaster richColors position="bottom-right" />
    </>
  );
}
