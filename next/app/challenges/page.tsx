import { redirect } from "next/navigation";

export default async function ChallengeRootPage() {
    const latest = { id: 1 }; // get from database

    if (!latest) {
        return <div className="p-6">No challenges available.</div>;
    }

    redirect(`/challenges/${latest.id}`);
}