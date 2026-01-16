"use client";

import { useEffect, useState } from "react";
import { LeaderboardItem } from "./membership";
import { LeaderboardTable } from "./LeaderboardTable";
import { AddMembershipModal } from "./AddMembershipModal";

export default function Leaderboard() {
    const [items, setItems] = useState<LeaderboardItem[]>([]);
    const [open, setOpen] = useState(false);
    const [isOfficer, setIsOfficer] = useState(false);

    async function userStatus() {
        const res = await fetch('/api/authLevel');
        const data = await res.json();
        setIsOfficer(data.isOfficer);
    }

    async function load() {
        const res = await fetch("/api/memberships");
        if (res.ok) {
            const data = await res.json();
            setItems(data);
        }
    }

    useEffect(() => {
        userStatus();
        load();
    }, [])

    return (
        <section className="py-8 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                <LeaderboardTable 
                    items={items} 
                    title="Memberships Leaderboard"
                    onAdd={isOfficer ? () => setOpen(true) : undefined}
                    addLabel="Add Membership"
                />
                {isOfficer && (
                    <AddMembershipModal open={open} onOpenChange={setOpen} onCreated={load} />
                )}
            </div>
        </section>
    )
}
