import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { getCurrentConstitutionDocument } from "@/lib/constitution/document";
import { getViewerPrimaryOfficerSlots } from "@/lib/constitution/auth";
import {
  buildConstitutionProposalView,
  constitutionProposalDetailInclude,
} from "@/lib/constitution/proposals";
import { ConstitutionGovernanceQueue } from "./ConstitutionGovernanceQueue";

export default async function ConstitutionDashboardPage() {
  const authLevel = await getAuthLevel();
  if (!authLevel.isPrimary) {
    redirect("/");
  }

  const [document, activePrimaryCount, proposals, viewerPrimaryOfficerSlots] =
    await Promise.all([
    getCurrentConstitutionDocument(),
    prisma.officer.count({
      where: {
        is_active: true,
        position: { is_primary: true },
      },
    }),
    prisma.constitutionProposal.findMany({
      where: {
        status: {
          not: "DRAFT",
        },
      },
      include: constitutionProposalDetailInclude,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    }),
    getViewerPrimaryOfficerSlots(authLevel.userId),
  ]);

  const proposalViews = proposals.map((proposal) =>
    buildConstitutionProposalView(proposal, authLevel, {
      currentDocumentSha: document.sha,
      activePrimaryCount,
      viewerPrimaryOfficerSlots,
    })
  );

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      <ConstitutionGovernanceQueue initialProposals={proposalViews} />
    </div>
  );
}
