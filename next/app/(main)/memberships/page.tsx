"use client"

import { useEffect, useState } from "react"
import { LeaderboardItem } from "./membership"
import { AddMembershipModal } from "./AddMembershipModal"
import { DataTable, Column } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import Avatar from "boring-avatars"
import Image from "next/image"
import { BRAND_AVATAR_COLORS } from "@/lib/theme/colors"

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
                <Badge variant="cat-2" className="font-bold text-sm tabular-nums">
                    {item.rank}
                </Badge>
            )
        },
        {
            key: "name",
            header: "User",
            sortable: true,
            isPrimary: true,
            render: (item) => (
                <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                        {item.image && item.image !== "https://source.boringavatars.com/beam/" ? (
                            <Image
                                src={item.image}
                                alt={`Photo of ${item.name}`}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full object-cover sm:h-8 sm:w-8"
                                unoptimized
                            />
                        ) : (
                            <span className="block sm:hidden">
                                <Avatar size={40} name={item.name || "default"} colors={[...BRAND_AVATAR_COLORS]} variant="beam" />
                            </span>
                        )}
                        {item.image && item.image === "https://source.boringavatars.com/beam/" || !item.image ? (
                            <span className="hidden sm:block">
                                <Avatar size={32} name={item.name || "default"} colors={[...BRAND_AVATAR_COLORS]} variant="beam" />
                            </span>
                        ) : null}
                        <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-chart-2 text-[10px] font-bold text-white sm:hidden">
                            {item.rank}
                        </span>
                    </div>
                    <span className="font-medium text-foreground">{item.name}</span>
                </div>
            )
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
