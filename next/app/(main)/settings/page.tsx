import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import ProfileSettings from "./ProfileSettings";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Settings - SSE",
};

export default async function SettingsPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return (
            <section className="w-full max-w-3xl mx-auto space-y-4">
                <h1 className="text-2xl font-bold font-heading mb-2">Settings</h1>
                <p className="text-muted-foreground">
                    You need to sign in to edit your profile settings.
                </p>
                <Button asChild>
                    <Link href="/api/auth/signin">Sign In</Link>
                </Button>
            </section>
        );
    }

    return (
        <section className="w-full max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold font-heading mb-6">Settings</h1>
            <ProfileSettings />
        </section>
    );
}
