import React from "react";
import { LeaderboardItem } from "./membership"

interface LeaderboardRowProps{
    item: LeaderboardItem
    onClickUser?: (id: number) => void;
}

function LeaderboardRowComponent({ item, onClickUser }: LeaderboardRowProps) {
  const { rank, userId, name, membershipCount, lastMembershipAt } = item; // note plural
  return (
    <tr className="hover">
      <td className="text-right pr-3 w-14">{rank}</td>
      <td>
        <button onClick={() => onClickUser?.(userId)}>{name}</button>
      </td>
      <td className="text-right">{membershipCount}</td>
      <td>{lastMembershipAt ? new Date(lastMembershipAt).toLocaleString() : "—"}</td>
    </tr>
  );
}

function LeaderboardRowComponentMobile({ item }: LeaderboardRowProps) {
  const {rank, name, membershipCount, lastMembershipAt} = item;
  return (
    <li className="py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="badge badge-neutral shrink-0">{rank}</span>
          <span className="text-left">{name}</span>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-70 leading-none">Memberships</div>
          <div className="font-medium tabular-nums">{membershipCount}</div>
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between text-xs opacity-70">
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