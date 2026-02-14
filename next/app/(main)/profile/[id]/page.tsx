import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import ProfileContent from "./ProfileContent";

interface ProfilePageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
    await params;
    return {
        title: `Profile - SSE`,
    };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/");
    }

    return (
        <section className="w-full max-w-5xl mx-auto">
            <ProfileContent userId={id} />
        </section>
    );
}
