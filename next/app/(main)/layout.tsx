// This file defines the base layout for all main scrolling pages in the application.

import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/Footer";
import ScrollToTopButton from "@/components/nav/ScrollToTopButton";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { Toaster } from "@/components/ui/sonner";
import { getAuthLevel } from "@/lib/services/authLevelService";

export default async function MainLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const authLevel = await getAuthLevel();

    return (
        <>
            <Navbar
                serverUserId={authLevel.userId}
                serverShowDashboard={authLevel.isOfficer || authLevel.isMentor}
                serverProfileComplete={authLevel.profileComplete}
            />
            <div className="pt-20">
                <AnnouncementBanner />
            </div>
            <main className="flex flex-col grow items-center px-2 pb-2 md:px-3 md:pb-3 lg:px-4 lg:pb-4 w-full overflow-x-hidden">
                {children}
            </main>
            <ScrollToTopButton />
            <Footer />
            <Toaster richColors position="bottom-right" />
        </>
    );
}