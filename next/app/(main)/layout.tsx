/**
 * Layout for the SSE frontend (all non-Payload routes).
 *
 * Wraps children in the SSE-specific React context providers (session, theme,
 * style-mode, font-mode, profile-image) that were previously in the root
 * layout.  Moving them here keeps the Payload admin panel's React tree clean.
 */

import Navbar from "@/components/nav/Navbar";
import Footer from "@/components/Footer";
import ScrollToTopButton from "@/components/nav/ScrollToTopButton";
import { Toaster } from "@/components/ui/sonner";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { Providers } from "../Providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [authLevel, session] = await Promise.all([
        getAuthLevel(),
        getServerSession(authOptions),
    ]);

    return (
        <Providers session={session}>
            <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted overflow-x-hidden">
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
            </div>
        </Providers>
    );
}