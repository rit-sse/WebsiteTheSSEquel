import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AmendmentStatusBadge from "@/components/amendments/AmendmentStatusBadge";
import { AmendmentStatus } from "@prisma/client";

type AmendmentCardProps = {
  amendment: {
    id: number;
    title: string;
    description: string;
    status: AmendmentStatus;
    totalVotes: number;
    approveVotes: number;
    rejectVotes: number;
    author?: {
      name: string | null;
    };
  };
};

export default function AmendmentCard({ amendment }: AmendmentCardProps) {
  return (
    <Card depth={2} className="p-4 md:p-5">
      <CardHeader className="p-0">
        <div className="flex flex-wrap gap-2 items-start justify-between">
          <Link href={`/about/constitution/amendments/${amendment.id}`} className="group">
            <CardTitle className="text-base sm:text-lg group-hover:text-primary transition-colors">
              {amendment.title}
            </CardTitle>
          </Link>
          <AmendmentStatusBadge status={amendment.status} />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {amendment.author?.name ?? "Unknown author"}
        </p>
      </CardHeader>
      <CardContent className="p-0 pt-3">
        <p className="text-sm text-foreground line-clamp-2">{amendment.description}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{amendment.totalVotes} votes</span>
          <span className="text-emerald-700 dark:text-emerald-300">Approve: {amendment.approveVotes}</span>
          <span className="text-rose-700 dark:text-rose-300">Reject: {amendment.rejectVotes}</span>
        </div>
      </CardContent>
    </Card>
  );
}
