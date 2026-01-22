import React from "react";
import { LeaderboardItem } from "./membership"
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface LeaderboardRowProps {
    item: LeaderboardItem
    onClickUser?: (id: number) => void;
}

function LeaderboardRowComponent({ item, onClickUser }: LeaderboardRowProps) {
    const { rank, userId, name, membershipCount, lastMembershipAt } = item;
    return (
        <TableRow>
            <TableCell className="text-right w-14 font-medium">{rank}</TableCell>
            <TableCell>
                <button 
                    onClick={() => onClickUser?.(userId)}
                    className="hover:underline text-primary"
                >
                    {name}
                </button>
            </TableCell>
            <TableCell className="text-right tabular-nums">{membershipCount}</TableCell>
            <TableCell className="text-muted-foreground">
                {lastMembershipAt ? new Date(lastMembershipAt).toLocaleString() : "—"}
            </TableCell>
        </TableRow>
    );
}

function LeaderboardRowComponentMobile({ item }: LeaderboardRowProps) {
    const { rank, name, membershipCount, lastMembershipAt } = item;
    return (
        <li className="py-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="secondary" className="shrink-0">{rank}</Badge>
                    <span className="text-left font-medium">{name}</span>
                </div>
                <div className="text-right">
                    <div className="text-xs text-muted-foreground leading-none">Memberships</div>
                    <div className="font-medium tabular-nums">{membershipCount}</div>
                </div>
            </div>

            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                    {lastMembershipAt
                        ? new Date(lastMembershipAt).toLocaleDateString()
                        : "No recent activity"}
                </span>
            </div>
        </li>
    )
}

export const LeaderboardRow = React.memo(LeaderboardRowComponent);
export const LeaderboardRowMobile = React.memo(LeaderboardRowComponentMobile);
