import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export const metadata = {
    title: "Settings - SSE",
};

/**
 * Settings page now redirects to the user's profile page,
 * where editing is done inline via the "Edit Profile" button.
 */
export default async function SettingsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/api/auth/signin");
    }

    // Look up the user's numeric ID for the profile route
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
    });

    if (user) {
        redirect(`/profile/${user.id}`);
    }

    // Fallback if user not found (shouldn't happen for authenticated users)
    redirect("/");
}
