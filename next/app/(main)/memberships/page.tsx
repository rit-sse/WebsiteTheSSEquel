"use client"

import { useEffect, useState } from "react"
import { LeaderboardItem } from "./membership"
import { AddMembershipModal } from "./AddMembershipModal"
import { DataTable, Column } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Leaderboard() {
    const [items, setItems] = useState<LeaderboardItem[]>([])
    const [open, setOpen] = useState(false)
    const [isOfficer, setIsOfficer] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    async function userStatus() {
        const res = await fetch('/api/authLevel')
        const data = await res.json()
        setIsOfficer(data.isOfficer)
    }

    async function load() {
        setIsLoading(true)
        try {
            const res = await fetch("/api/memberships")
            if (res.ok) {
                const data = await res.json()
                const rankedData = data.map((item: LeaderboardItem, index: number) => ({
                    ...item,
                    rank: index + 1
                }))
                setItems(rankedData)
            }
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        userStatus()
        load()
    }, [])

    const columns: Column<LeaderboardItem>[] = [
        {
            key: "rank",
            header: "Rank",
            className: "w-14",
            mobileHidden: true,
            render: (item) => (
                <Badge variant="secondary" className="font-bold text-sm tabular-nums">
                    {item.rank}
                </Badge>
            )
        },
        {
            key: "name",
            header: "User",
            sortable: true,
            isPrimary: true,
            render: (item) => {
                const hasImage = item.image && item.image !== "https://source.boringavatars.com/beam/";
                const initials = (item.name || "?")
                    .split(" ")
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                return (
                    <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                            <Avatar className="h-10 w-10 sm:h-8 sm:w-8">
                                {hasImage ? <AvatarImage src={item.image!} alt={item.name} /> : null}
                                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                            </Avatar>
                            <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground sm:hidden">
                                {item.rank}
                            </span>
                        </div>
                        <span className="font-medium text-primary">{item.name}</span>
                    </div>
                );
            }
        },
        {
            key: "membershipCount",
            header: "Memberships",
            sortable: true,
            render: (item) => (
                <span className="text-2xl font-bold tabular-nums text-foreground sm:text-lg">
                    {item.membershipCount}
                </span>
            )
        },
        {
            key: "lastMembershipAt",
            header: "Latest Membership",
            render: (item) => (
                <span className="text-muted-foreground text-xs">
                    {item.lastMembershipAt 
                        ? new Date(item.lastMembershipAt).toLocaleString() 
                        : "—"}
                </span>
            )
        }
    ]

    return (
        <section className="w-full py-8 px-4 md:px-8 lg:px-12">
            <div className="w-full">
                <DataTable
                    data={items}
                    columns={columns}
                    keyField="userId"
                    title="Memberships Leaderboard"
                    searchPlaceholder="Search members..."
                    searchFields={["name"]}
                    onAdd={isOfficer ? () => setOpen(true) : undefined}
                    addLabel="Add Membership"
                    isLoading={isLoading}
                    emptyMessage="No memberships yet"
                />
                {isOfficer && (
                    <AddMembershipModal open={open} onOpenChange={setOpen} onCreated={load} />
                )}
            </div>
        </section>
    )
}
