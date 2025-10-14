"use client";

import { useEffect, useState } from "react";
import { LeaderboardItem } from "./item";
import { LeaderboardTable } from "./LeaderboardTable";

export default function Leaderboard() {
    const [items, setItems] = useState<LeaderboardItem[]>([]);

    useEffect(() => {
        (async () => {
        const res = await fetch("/api/memberships");
        const data = await res.json();
        setItems(data);
        })().catch(console.error);
    }, []);

    return (
        <div className="p-6">
            <LeaderboardTable items={items}/>
        </div>
    )

}