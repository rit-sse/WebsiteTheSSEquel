import { LeaderboardItem } from "./membership";
import { LeaderboardRow, LeaderboardRowMobile } from "./LeaderboardRow";
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LeaderboardProps {
    items: LeaderboardItem[]
    onClickUser?: (id: number) => void;
    title?: string;
    action?: React.ReactNode;
}

export function LeaderboardTable({ items, onClickUser, title, action }: LeaderboardProps) {
    return (
        <Card className="w-full">
            {(title || action) && (
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    {title && <CardTitle className="text-2xl font-semibold">{title}</CardTitle>}
                    {action && <div className="hidden md:block">{action}</div>}
                </CardHeader>
            )}
            <CardContent className="p-0">
                {/* Desktop table */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-20 text-right">#</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead className="text-right">Memberships</TableHead>
                                <TableHead>Latest Membership</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((it, i) => (
                                <LeaderboardRow key={it.userId} item={{...it, rank: i + 1}} onClickUser={onClickUser}/>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                
                {/* Mobile list */}
                <div className="md:hidden px-4 pb-4">
                    {action && <div className="mb-4 flex justify-center">{action}</div>}
                    <ul className="divide-y divide-border list-none m-0">
                        {items.map((it, i) => (
                            <LeaderboardRowMobile key={it.userId} item={{...it, rank: i + 1}}/>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}
