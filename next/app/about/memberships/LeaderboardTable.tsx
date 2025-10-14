import { LeaderboardItem } from "./item";
import { LeaderboardRow } from "./LeaderboardRow";

interface LeaderboardProps {
    items: LeaderboardItem[]
    onClickUser?: (id: number) => void;
}

export function LeaderboardTable({ items, onClickUser }: LeaderboardProps) {
    return (
        <table className="w-full text-left">
            <thead>
                <tr>
                    <th className="w-6 text-right pr-3">#</th>
                    <th>User</th>
                    <th className="text-right">Memberships</th>
                    <th>Lastest Membership</th>
                </tr>
            </thead>
            <tbody>
                {items.map((it, i) => (
                    <LeaderboardRow key={it.userId} item={{...it, rank: i + 1}} onClickUser={onClickUser}/>
                ))}
            </tbody>
        </table>
    )
}