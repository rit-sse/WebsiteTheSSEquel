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
        const data = await res.json();
        setItems(data);
    }

    useEffect(() => {
        userStatus();
        load();
    }, [])

    return (
        <div className="p-6 w-full max-w-6xl mx-auto">
            <LeaderboardTable 
                items={items} 
                title="Memberships Leaderboard"
                action={isOfficer ? (
                    <button className="btn bg-background" onClick={() => setOpen(true)}>
                        Add Membership
                    </button>
                ) : undefined}
            />
            {isOfficer && (
                <AddMembershipModal open={open} onOpenChange={setOpen} onCreated={load} />
            )}
        </div>
    )
}
