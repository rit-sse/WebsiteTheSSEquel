import prisma from "@/lib/prisma";
import { getAuthLevel } from "@/lib/services/authLevelService";
import {
  getOpenCommitteeHeadNominationCycle,
  listCommitteeHeadPositions,
} from "@/lib/committeeHeadNominations";
import NominateClient from "./NominateClient";
import type { CommitteeHeadNominateData } from "./types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Committee Head Nominations · SSE",
  description:
    "Apply for or nominate someone for an SSE Committee Head role.",
};

export default async function NominatePage() {
  const [authLevel, cycle, positions] = await Promise.all([
    getAuthLevel(),
    getOpenCommitteeHeadNominationCycle(),
    listCommitteeHeadPositions(),
  ]);

  let viewer: CommitteeHeadNominateData["viewer"] = null;
  if (authLevel.userId) {
    const user = await prisma.user.findUnique({
      where: { id: authLevel.userId },
      select: { id: true, name: true, email: true, major: true },
    });
    if (user) viewer = user;
  }

  return (
    <NominateClient
      data={{
        cycle: cycle
          ? {
              id: cycle.id,
              name: cycle.name,
              term: cycle.term,
              year: cycle.year,
            }
          : null,
        positions,
        viewer,
        isPrimary: authLevel.isPrimary,
      }}
    />
  );
}
