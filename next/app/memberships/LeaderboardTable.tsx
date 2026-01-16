import { LeaderboardItem } from "./membership";
import { LeaderboardRow, LeaderboardRowMobile } from "./LeaderboardRow";
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface LeaderboardProps {
    items: LeaderboardItem[]
    onClickUser?: (id: number) => void;
    title?: string;
    onAdd?: () => void;
    addLabel?: string;
}

export function LeaderboardTable({ items, onClickUser, title, onAdd, addLabel = "Add Membership" }: LeaderboardProps) {
    return (
        <Card className="w-full max-w-full overflow-hidden" depth={2}>
            {/* Title bar with accent background */}
            {title && (
                <div className="bg-accent/20 border-l-4 border-accent px-4 py-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    {onAdd && (
                        <Button onClick={onAdd} className="hidden md:flex text-sm bg-accent text-accent-foreground hover:bg-accent/90">
                            <Plus className="h-4 w-4 mr-2" />
                            {addLabel}
                        </Button>
                    )}
                </div>
            )}
            
            {/* Content area */}
            <div className="p-3 sm:p-4">
                {/* Desktop table */}
                <div className="hidden md:block rounded-md border border-border overflow-hidden bg-surface-3">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-accent/15 border-b-2 border-accent/30 hover:bg-accent/15">
                                <TableHead className="w-20 text-right font-semibold">#</TableHead>
                                <TableHead className="font-semibold">User</TableHead>
                                <TableHead className="text-right font-semibold">Memberships</TableHead>
                                <TableHead className="font-semibold">Latest Membership</TableHead>
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
                <div className="md:hidden">
                    {onAdd && (
                        <div className="mb-4 flex justify-center">
                            <Button onClick={onAdd} className="w-full text-sm bg-accent text-accent-foreground hover:bg-accent/90">
                                <Plus className="h-4 w-4 mr-2" />
                                {addLabel}
                            </Button>
                        </div>
                    )}
                    <ul className="divide-y divide-border list-none m-0 bg-surface-3 rounded-md border border-border">
                        {items.map((it, i) => (
                            <LeaderboardRowMobile key={it.userId} item={{...it, rank: i + 1}}/>
                        ))}
                    </ul>
                </div>

                {/* Footer with count */}
                <div className="mt-3 text-xs sm:text-sm text-muted-foreground">
                    {items.length} members
                </div>
            </div>
        </Card>
    )
}
