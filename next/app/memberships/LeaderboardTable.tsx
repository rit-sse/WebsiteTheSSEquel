import { LeaderboardItem } from "./membership";
import { LeaderboardRow, LeaderboardRowMobile } from "./LeaderboardRow";

interface LeaderboardProps {
    items: LeaderboardItem[]
    onClickUser?: (id: number) => void;
}

export function LeaderboardTable({ items, onClickUser }: LeaderboardProps) {
    return (
        <div className="w-full flex align-center">
            {/* desktop table */}
            <div className="hidden md:block">
                <table className="table w-full text-left">
                <thead>
                    <tr>
                        <th className="w-6 text-right pr-3 overflow-hidden">#</th>
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
            </div>
            
            { /* mobile cards */}   
            <ul className="md:hidden divide-y divide-base-300 list-none m-0 w-full">
                {items.map((it, i) => (
                    <LeaderboardRowMobile key={it.userId} item={{...it, rank: i + 1}}/>
                ))}
            </ul>
        </div>
        
    )
}