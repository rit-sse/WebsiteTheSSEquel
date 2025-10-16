"use client";

import { useEffect, useState } from "react";
import { LeaderboardItem } from "./item";
import { LeaderboardTable } from "./LeaderboardTable";
import { AddMembershipModal } from "./AddMembershipModal";

export default function Leaderboard() {
    const [items, setItems] = useState<LeaderboardItem[]>([]);
    const [open, setOpen] = useState(false);

    async function load() {
        const res = await fetch("/api/memberships");
        const data = await res.json();
        setItems(data);
    }

    useEffect(() => {
        load();
    }, [])

    return (
        <div className="p-6">
            <div className="flex items-center justify-between gap-2">
                <h1 className="text-xl font-semibold">Memberships Leaderboard</h1>
                <button className="btn btn-success" onClick={() => setOpen(true)}>Add Membership</button>
            </div>

            <LeaderboardTable items={items}/>
            <AddMembershipModal open={open} onOpenChange={setOpen} onCreated={load}></AddMembershipModal>
        </div>
        
        
    
        
    )

}