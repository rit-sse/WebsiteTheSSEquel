import { redirect } from "next/navigation";
import { getAuthLevel } from "@/lib/services/authLevelService";
import {
  PRESIDENT_TITLE,
  VICE_PRESIDENT_TITLE,
  compareByPrimaryOrder,
  getAcceptedRunningMate,
  getElectionWithRelations,
  isTicketDerivedOffice,
  tallyInstantRunoffElection,
} from "@/lib/elections";
import NewSemesterClient, {
  type DispatchRecipient,
} from "./NewSemesterClient";

/**
 * SE-Office-only page. Lands here from the email sent by
 * `/api/elections/[id]/start-new-semester`. Shows the certified winners
 * and exposes a single "Send primary invites" action that dispatches
 * officer invitations to each of them.
 */
export default async function NewSemesterDispatchPage({
  params,
}: {
  params: Promise<{ electionId: string }>;
}) {
  const { electionId } = await params;
  const electionIdNum = Number(electionId);
  if (!Number.isInteger(electionIdNum)) {
    redirect("/dashboard/elections");
  }

  const authLevel = await getAuthLevel();
  if (!authLevel.userId) {
    redirect(`/login?callbackUrl=/dashboard/new-semester/${electionId}`);
  }
  if (!authLevel.isSeAdmin) {
    redirect("/elections");
  }

  const election = await getElectionWithRelations({ id: electionIdNum });
  if (!election || election.status !== "CERTIFIED") {
    redirect("/dashboard/elections");
  }

  // Compute winners mirroring the dispatch endpoint so we preview what
  // will be sent out.
  const officesToTally = election.offices.filter(
    (o) => !isTicketDerivedOffice(o.officerPosition.title)
  );
  const rawResults = officesToTally.map((office) =>
    tallyInstantRunoffElection({
      office,
      ballots: election.ballots.map((ballot) => ({
        rankings: ballot.rankings.map((ranking) => ({
          electionOfficeId: ranking.electionOfficeId,
          nominationId: ranking.nominationId,
          rank: ranking.rank,
        })),
      })),
    })
  );

  const recipients: DispatchRecipient[] = [];
  for (const raw of rawResults) {
    if (!raw.winner) continue;
    const office = election.offices.find((o) => o.id === raw.officeId);
    if (!office) continue;
    const nomination = office.nominations.find((n) => n.id === raw.winner!.id);
    if (!nomination) continue;
    recipients.push({
      positionTitle: office.officerPosition.title,
      name: nomination.nominee.name,
      email: nomination.nominee.email,
      userId: nomination.nomineeUserId,
    });
  }

  // Ticket VP
  const presidentResult = rawResults.find(
    (r) => r.officeTitle === PRESIDENT_TITLE
  );
  const presidentOffice = election.offices.find(
    (o) => o.officerPosition.title === PRESIDENT_TITLE
  );
  const vpOffice = election.offices.find(
    (o) => o.officerPosition.title === VICE_PRESIDENT_TITLE
  );
  if (presidentResult?.winner && presidentOffice && vpOffice) {
    const winningNom = presidentOffice.nominations.find(
      (n) => n.id === presidentResult.winner!.id
    );
    const invitee = getAcceptedRunningMate(winningNom);
    if (invitee) {
      recipients.push({
        positionTitle: VICE_PRESIDENT_TITLE,
        name: invitee.name,
        email: invitee.email,
        userId: invitee.id,
      });
    }
  }

  // Canonical primary-office order for the recipient grid.
  recipients.sort((a, b) =>
    compareByPrimaryOrder(a.positionTitle, b.positionTitle)
  );

  return (
    <NewSemesterClient
      electionId={electionIdNum}
      electionTitle={election.title}
      electionSlug={election.slug}
      recipients={recipients}
    />
  );
}
