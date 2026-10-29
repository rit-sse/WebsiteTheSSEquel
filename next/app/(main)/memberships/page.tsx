"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { LeaderboardItem } from "./membership";
import { AddMembershipModal } from "./AddMembershipModal";
import { PendingMembershipAwards } from "./PendingMembershipAwards";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Leaderboard() {
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const authKey = `${status}:${session?.user?.email ?? ""}`;
  const [officerAuthKey, setOfficerAuthKey] = useState<string | null>(null);
  const isOfficer = officerAuthKey === authKey;
  const [isLoading, setIsLoading] = useState(true);
  const [awardsRevision, setAwardsRevision] = useState(0);

  useEffect(() => {
    if (status === "loading") return;
    const controller = new AbortController();
    setOfficerAuthKey(null);
    void (async () => {
      try {
        const res = await fetch("/api/authLevel", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) return;
        const auth = await res.json();
        if (
          !controller.signal.aborted &&
          auth.isUser === true &&
          auth.userId != null &&
          auth.isOfficer === true
        ) {
          setOfficerAuthKey(authKey);
        }
      } catch {
        // Keep officer controls hidden if we can't verify access.
      }
    })();
    return () => controller.abort();
  }, [authKey, status]);

  async function load() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/memberships");
      if (res.ok) {
        const data = await res.json();
        const rankedData = data.map((item: LeaderboardItem, index: number) => ({
          ...item,
          rank: index + 1,
        }));
        setItems(rankedData);
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

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
      ),
    },
    {
      key: "name",
      header: "User",
      sortable: true,
      isPrimary: true,
      render: (item) => {
        const hasImage =
          item.image && item.image !== "https://source.boringavatars.com/beam/";
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
                {hasImage ? (
                  <AvatarImage src={item.image!} alt={item.name} />
                ) : null}
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground sm:hidden">
                {item.rank}
              </span>
            </div>
            <span className="font-medium text-primary">{item.name}</span>
          </div>
        );
      },
    },
    {
      key: "membershipCount",
      header: "Memberships",
      sortable: true,
      render: (item) => (
        <span className="text-2xl font-bold tabular-nums text-foreground sm:text-lg">
          {item.membershipCount}
        </span>
      ),
    },
    {
      key: "lastMembershipAt",
      header: "Latest Membership",
      render: (item) => (
        <span className="text-muted-foreground text-xs">
          {item.lastMembershipAt
            ? new Date(item.lastMembershipAt).toLocaleDateString()
            : "—"}
        </span>
      ),
    },
  ];

  return (
    <section className="w-full py-8 px-4 md:px-8 lg:px-12">
      <div className="w-full">
        <DataTable
          data={items}
          columns={columns}
          keyField="userId"
          title="Membership Leaderboard"
          searchPlaceholder="Search members..."
          searchFields={["name"]}
          onAdd={isOfficer ? () => setOpen(true) : undefined}
          addLabel="Add Membership"
          isLoading={isLoading}
          emptyMessage="No memberships yet for this term"
          enablePagination
          pageSizeOptions={[10, 25, 50, 100]}
          defaultPageSize={25}
        />
        {isOfficer && (
          <AddMembershipModal
            open={open}
            onOpenChange={setOpen}
            onCreated={() => {
              void load();
              setAwardsRevision((value) => value + 1);
            }}
          />
        )}
        {isOfficer && <PendingMembershipAwards revision={awardsRevision} />}
      </div>
    </section>
  );
}
