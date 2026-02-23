import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getAuthLevel } from "@/lib/services/authLevelService";
import prisma from "@/lib/prisma";
import { computeVoteSummary } from "@/lib/services/amendmentService";
import { AmendmentStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import AmendmentCard from "@/components/amendments/AmendmentCard";

export default async function AmendmentsListPage({
  searchParams,
}: {
  searchParams?: { status?: string | string[] };
}) {
  const authLevel = await getAuthLevel();
  const statusValue = Array.isArray(searchParams?.status) ? searchParams.status[0] : searchParams?.status;
  const statusFilter = statusValue?.toUpperCase();
  const where =
    statusFilter && Object.values(AmendmentStatus).includes(statusFilter as AmendmentStatus)
      ? { status: statusFilter as AmendmentStatus }
      : {};

  const amendments = await prisma.amendment.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
      votes: {
        select: { approve: true },
      },
    },
  });

  const rows = amendments.map((amendment) => ({
    id: amendment.id,
    title: amendment.title,
    description: amendment.description,
    status: amendment.status,
    author: amendment.author,
    ...computeVoteSummary(amendment.votes),
  }));

  return (
    <section className="w-full max-w-6xl px-2 md:px-4">
      <div className="py-4 flex flex-wrap gap-2 justify-between items-center">
        <h1 className="text-3xl font-display font-bold">Constitution Amendments</h1>
        <div className="flex flex-wrap gap-2">
          {authLevel.isMember ? (
            <Button asChild>
              <Link href="/about/constitution/amendments/new">Propose Amendment</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/about/constitution/amendments" className="text-sm">
          <Button size="sm" variant={statusFilter ? "neutral" : "default"}>
            All
          </Button>
        </Link>
        <Link href="/about/constitution/amendments?status=OPEN" className="text-sm">
          <Button size="sm" variant={statusFilter === "OPEN" ? "default" : "neutral"}>
            Open Forum
          </Button>
        </Link>
        <Link href="/about/constitution/amendments?status=VOTING" className="text-sm">
          <Button size="sm" variant={statusFilter === "VOTING" ? "default" : "neutral"}>
            Voting
          </Button>
        </Link>
        <Link href="/about/constitution/amendments?status=APPROVED" className="text-sm">
          <Button size="sm" variant={statusFilter === "APPROVED" ? "default" : "neutral"}>
            Approved
          </Button>
        </Link>
        <Link href="/about/constitution/amendments?status=REJECTED" className="text-sm">
          <Button size="sm" variant={statusFilter === "REJECTED" ? "default" : "neutral"}>
            Rejected
          </Button>
        </Link>
        <Link href="/about/constitution/amendments?status=MERGED" className="text-sm">
          <Button size="sm" variant={statusFilter === "MERGED" ? "default" : "neutral"}>
            Merged
          </Button>
        </Link>
      </div>

      <Card depth={1} className="p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.length === 0 ? (
            <p className="text-muted-foreground">No amendments found.</p>
          ) : (
            rows.map((amendment) => <AmendmentCard key={amendment.id} amendment={amendment} />)
          )}
        </div>
      </Card>
    </section>
  );
}
