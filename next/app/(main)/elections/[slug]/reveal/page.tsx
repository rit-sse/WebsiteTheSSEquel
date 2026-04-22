import { redirect } from "next/navigation";
import {
  PRESIDENT_TITLE,
  VICE_PRESIDENT_TITLE,
  compareByPrimaryOrder,
  tallyElectionForDisplay,
} from "@/lib/elections";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { resolveUserImage } from "@/lib/s3Utils";
import ElectionResultsReveal from "./ElectionResultsReveal";
import type { RevealSlide } from "./ElectionResultsReveal";

/**
 * "Your new officers" reveal server page. Plays a full-screen carousel
 * announcing each winner in turn, then offers a CTA to the stats page.
 *
 * Only available after certification — before then the stats page is
 * still accessible to admins for pre-certification review and a
 * celebration would be premature.
 */
export default async function ElectionResultsRevealPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const authLevel = await getAuthLevel();
  if (!authLevel.userId) {
    redirect(`/login?callbackUrl=/elections/${slug}/reveal`);
  }

  const tallied = await tallyElectionForDisplay(slug);
  if (!tallied) {
    redirect("/elections");
  }
  const { election, results } = tallied;

  if (election.status !== "CERTIFIED") {
    // Not yet official. Bounce to the stats page — admins get the
    // in-page certify flow, everyone else gets the "results not
    // available" empty state.
    redirect(`/elections/${slug}/results`);
  }

  // Slide order follows the shared canonical primary-office order
  // (President → VP → Treasurer → Secretary → Mentoring Head). Mentoring
  // Head sits last site-wide.
  const orderedResults = [...results].sort((a, b) =>
    compareByPrimaryOrder(a.officeTitle, b.officeTitle)
  );

  const slides: RevealSlide[] = [];
  for (const r of orderedResults) {
    if (!r.winner) continue;

    if (r.ticketDerived && r.officeTitle === VICE_PRESIDENT_TITLE) {
      // VP slide — no nomination record; pull the invitee from the
      // presidential office's running-mate invitation.
      const presidentOffice = election.offices.find(
        (o) => o.officerPosition.title === PRESIDENT_TITLE
      );
      let inviteeUserId = 0;
      let inviteeName = r.winner.name;
      let inviteeImage: string | null = null;
      if (presidentOffice) {
        for (const nomination of presidentOffice.nominations) {
          const inv = nomination.runningMateInvitation;
          if (inv && inv.status === "ACCEPTED" && inv.invitee) {
            inviteeUserId = inv.invitee.id;
            inviteeName = inv.invitee.name;
            inviteeImage = resolveUserImage(
              inv.invitee.profileImageKey ?? null,
              inv.invitee.googleImageURL ?? null
            );
            break;
          }
        }
      }
      slides.push({
        officeTitle: VICE_PRESIDENT_TITLE,
        winnerName: inviteeName,
        winnerUserId: inviteeUserId,
        winnerImage: inviteeImage,
        statement:
          "Elected as the running mate on the winning presidential ticket.",
        yearLevel: null,
        program: null,
        isTicketDerived: true,
      });
      continue;
    }

    // Regular tallied office — find the winning nomination to pull
    // statement + year + program from the candidate profile.
    const office = election.offices.find((o) => o.id === r.officeId);
    const nomination = office?.nominations.find(
      (n) => n.id === r.winner?.nominationId
    );
    slides.push({
      officeTitle: r.officeTitle,
      winnerName: r.winner.name,
      winnerUserId: nomination?.nomineeUserId ?? 0,
      winnerImage: nomination?.nominee
        ? resolveUserImage(
            nomination.nominee.profileImageKey ?? null,
            nomination.nominee.googleImageURL ?? null
          )
        : null,
      statement: nomination?.statement?.trim() ?? "",
      yearLevel: nomination?.yearLevel ?? null,
      program: nomination?.program ?? null,
      isTicketDerived: false,
    });
  }

  return (
    <ElectionResultsReveal
      electionSlug={election.slug}
      electionTitle={election.title}
      slides={slides}
    />
  );
}
