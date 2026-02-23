import { Badge } from "@/components/ui/badge";
import { AmendmentStatus } from "@prisma/client";

const statusStyles: Record<AmendmentStatus, string> = {
  DRAFT: "secondary",
  OPEN: "outline",
  VOTING: "default",
  APPROVED: "outline",
  REJECTED: "destructive",
  MERGED: "secondary",
  WITHDRAWN: "destructive",
};

export default function AmendmentStatusBadge({ status }: { status: AmendmentStatus }) {
  return (
    <Badge variant={statusStyles[status]} className="font-mono tracking-wide">
      {status}
    </Badge>
  );
}
