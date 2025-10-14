import React from "react";
import { LeaderboardItem } from "./item"

interface LeaderboardRowProps{
    item: LeaderboardItem
    onClickUser?: (id: number) => void;
}

function LeaderboardRowComponent({ item, onClickUser }: LeaderboardRowProps) {
  const { rank, userId, name, membershipCount, lastMembershipAt } = item; // note plural
  return (
    <tr>
      <td className="text-right pr-3 w-14">{rank}</td>
      <td>
        <button onClick={() => onClickUser?.(userId)}>{name}</button>
      </td>
      <td className="text-right">{membershipCount}</td>
      <td>{lastMembershipAt ? new Date(lastMembershipAt).toLocaleString() : "—"}</td>
    </tr>
  );
}

export const LeaderboardRow = React.memo(LeaderboardRowComponent);