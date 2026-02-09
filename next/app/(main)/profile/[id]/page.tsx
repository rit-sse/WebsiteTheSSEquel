import { Metadata } from "next";
import ProfileContent from "./ProfileContent";

interface ProfilePageProps {
    params: { id: string };
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
    return {
        title: `Profile - SSE`,
    };
}

export default function ProfilePage({ params }: ProfilePageProps) {
    return (
        <section className="w-full max-w-5xl mx-auto">
            <ProfileContent userId={params.id} />
        </section>
    );
}
