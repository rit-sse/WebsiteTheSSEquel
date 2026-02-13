import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import ProfileContent from "./ProfileContent";

interface ProfilePageProps {
    params: { id: string };
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
    return {
        title: `Profile - SSE`,
    };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/");
    }

    return (
        <section className="w-full max-w-5xl mx-auto">
            <ProfileContent userId={params.id} />
        </section>
    );
}
