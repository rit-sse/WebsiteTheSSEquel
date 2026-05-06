// This file defines the base layout for all main scrolling pages in the application.

import Footer from "@/components/Footer";
import ScrollToTopButton from "@/components/nav/ScrollToTopButton";
import { Toaster } from "@/components/ui/sonner";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { getActiveElection } from "@/lib/elections";
import { getSiteBanners } from "@/lib/siteBanners";
import { listPagesForNavbar } from "@/lib/services/pageService";
import SiteHeader from "@/components/SiteHeader";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authLevel, activeElection, cmsNavPages] = await Promise.all([
    getAuthLevel(),
    getActiveElection(),
    listPagesForNavbar(),
  ]);
  const banners = await getSiteBanners(activeElection);

  return (
    <>
      <SiteHeader
        serverUserId={authLevel.userId}
        serverShowDashboard={
          authLevel.isOfficer || authLevel.isMentor || authLevel.isSeAdmin
        }
        serverProfileComplete={authLevel.profileComplete}
        serverIsSeAdmin={authLevel.isSeAdmin}
        serverActiveElection={activeElection}
        serverCmsNavPages={cmsNavPages}
        banners={banners}
      />
      <main className="flex flex-col grow items-center px-2 pb-2 md:px-3 md:pb-3 lg:px-4 lg:pb-4 w-full overflow-x-hidden">
        {children}
      </main>
      <ScrollToTopButton />
      <Footer />
      <Toaster richColors position="bottom-right" />
    </>
  );
}
