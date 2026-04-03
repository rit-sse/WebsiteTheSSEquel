import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { getCurrentConstitutionDocument } from "@/lib/constitution/document";
import { getViewerPrimaryOfficerSlots } from "@/lib/constitution/auth";
import {
  buildConstitutionProposalView,
  constitutionProposalDetailInclude,
} from "@/lib/constitution/proposals";
import { ConstitutionProposalDetail } from "../../ConstitutionProposalDetail";

export default async function ConstitutionProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proposalId = Number(id);
  if (!proposalId || Number.isNaN(proposalId)) {
    notFound();
  }

  const authLevel = await getAuthLevel();
  const [document, activePrimaryCount, proposal, viewerPrimaryOfficerSlots] =
    await Promise.all([
      getCurrentConstitutionDocument(),
      prisma.officer.count({
        where: {
          is_active: true,
          position: { is_primary: true },
        },
      }),
      prisma.constitutionProposal.findUnique({
        where: { id: proposalId },
        include: constitutionProposalDetailInclude,
      }),
      getViewerPrimaryOfficerSlots(authLevel.userId),
    ]);

  if (!proposal) {
    notFound();
  }

  if (proposal.status === "DRAFT" && proposal.authorId !== authLevel.userId) {
    notFound();
  }

  const proposalView = buildConstitutionProposalView(proposal, authLevel, {
    currentDocumentSha: document.sha,
    activePrimaryCount,
    viewerPrimaryOfficerSlots,
  });

  if (
    (proposalView.computedStatus === "SCHEDULED" ||
      proposalView.computedStatus === "OPEN") &&
    !authLevel.isUser
  ) {
    redirect(
      `/signin?callbackUrl=${encodeURIComponent(
        `/about/constitution/proposals/${proposalId}`
      )}`
    );
  }

  if (
    (proposalView.computedStatus === "SCHEDULED" ||
      proposalView.computedStatus === "OPEN") &&
    !authLevel.isMember
  ) {
    redirect("/");
  }

  return <ConstitutionProposalDetail initialProposal={proposalView} />;
}
