import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthLevel } from "@/lib/services/authLevelService";
import ProfileContent from "./ProfileContent";

interface ProfilePageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
    return {
        title: `Profile - SSE`,
    };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { id } = await params;
    const authLevel = await getAuthLevel();

    // Must be signed in
    if (!authLevel.isUser || authLevel.userId === null) {
        redirect("/");
    }

    // Only the profile owner or an officer can view a profile
    const isOwner = authLevel.userId === Number(id);
    if (!isOwner && !authLevel.isOfficer) {
        redirect("/");
    }

    return (
        <section className="w-full max-w-5xl mx-auto">
            <ProfileContent userId={id} />
        </section>
    );
}
