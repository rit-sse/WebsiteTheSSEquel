import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import ProfileSettings from "./ProfileSettings";

export const metadata = {
    title: "Settings - SSE",
};

export default async function SettingsPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/");
    }

    return (
        <section className="w-full max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold font-heading mb-6">Settings</h1>
            <ProfileSettings />
        </section>
    );
}
