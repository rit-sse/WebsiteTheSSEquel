"use client"

import { useEffect, useState } from "react"
import { LeaderboardItem } from "./membership"
import { AddMembershipModal } from "./AddMembershipModal"
import { DataTable, Column } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"

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
                // Add rank to each item
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
            header: "#",
            className: "w-14 text-right",
            render: (item) => (
                <Badge variant="secondary" className="font-medium">
                    {item.rank}
                </Badge>
            )
        },
        {
            key: "name",
            header: "User",
            sortable: true,
            render: (item) => (
                <span className="font-medium text-primary">{item.name}</span>
            )
        },
        {
            key: "membershipCount",
            header: "Memberships",
            sortable: true,
            className: "text-right",
            render: (item) => (
                <span className="tabular-nums font-medium">{item.membershipCount}</span>
            )
        },
        {
            key: "lastMembershipAt",
            header: "Latest Membership",
            className: "hidden sm:table-cell",
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
