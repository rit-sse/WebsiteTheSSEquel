// This file defines the base layout for all main scrolling pages in the application.

import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/Footer";
import ScrollToTopButton from "@/components/nav/ScrollToTopButton";
import { Toaster } from "@/components/ui/sonner";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { ActiveElectionBanner } from "@/components/elections/ActiveElectionBanner";
import { getActiveElection } from "@/lib/elections";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authLevel, activeElection] = await Promise.all([
    getAuthLevel(),
    getActiveElection(),
  ]);

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
      <ActiveElectionBanner />
      <main className="flex flex-col grow items-center px-2 pb-2 pt-20 md:px-3 md:pb-3 md:pt-20 lg:px-4 lg:pb-4 lg:pt-20 w-full overflow-x-hidden">
        {children}
      </main>
      <ScrollToTopButton />
      <Footer />
      <Toaster richColors position="bottom-right" />
    </>
  );
}
