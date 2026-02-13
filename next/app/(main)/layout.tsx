// This file defines the base layout for all main scrolling pages in the application.

import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/Footer";
import ScrollToTopButton from "@/components/nav/ScrollToTopButton";
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
            <main className="flex flex-col grow items-center px-2 py-2 md:px-3 md:py-3 lg:px-4 lg:py-4 w-full overflow-x-hidden">
                {children}
            </main>
            <ScrollToTopButton />
            <Footer />
            <Toaster richColors position="bottom-right" />
        </>
    );
}