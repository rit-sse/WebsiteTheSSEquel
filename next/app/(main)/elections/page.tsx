import prisma from "@/lib/prisma";
import {
  NeoCard,
  NeoCardHeader,
  NeoCardTitle,
  NeoCardDescription,
  NeoCardContent,
} from "@/components/ui/neo-card";
import { ElectionsListClient } from "./ElectionsListClient";
import type { ElectionStatus } from "@/components/elections/types";

export default async function ElectionsPage() {
  const elections = await prisma.election.findMany({
    where: {
      status: {
        notIn: ["DRAFT", "CANCELLED"],
      },
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      offices: {
        include: {
          officerPosition: { select: { id: true, title: true } },
          nominations: {
            select: { id: true, status: true, eligibilityStatus: true },
          },
        },
      },
    },
  });

  // Serialize dates for the client component
  const serializedElections = elections.map((election) => ({
    id: election.id,
    title: election.title,
    slug: election.slug,
    description: election.description,
    status: election.status as ElectionStatus,
    nominationsOpenAt: election.nominationsOpenAt.toISOString(),
    nominationsCloseAt: election.nominationsCloseAt.toISOString(),
    votingOpenAt: election.votingOpenAt.toISOString(),
    votingCloseAt: election.votingCloseAt.toISOString(),
    createdAt: election.createdAt.toISOString(),
    offices: election.offices.map((office) => ({
      id: office.id,
      officerPosition: {
        id: office.officerPosition.id,
        title: office.officerPosition.title,
      },
      nominations: office.nominations.map((nom) => ({
        id: nom.id,
        status: nom.status,
        eligibilityStatus: nom.eligibilityStatus,
      })),
    })),
  }));

  return (
    <section className="w-full max-w-5xl space-y-6">
      <NeoCard depth={1}>
        <NeoCardHeader>
          <NeoCardTitle>SSE Elections</NeoCardTitle>
          <NeoCardDescription>
            Ranked choice voting for officer positions
          </NeoCardDescription>
        </NeoCardHeader>
        <NeoCardContent>
          <ElectionsListClient elections={serializedElections} />
        </NeoCardContent>
      </NeoCard>
    </section>
  );
}
