import { getAuthLevel } from "@/lib/services/authLevelService";
import TechCommitteeApplicationReviewPage from "./review-page";

export default async function TechCommitteeApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const authLevel = await getAuthLevel();
  const canTakeActions =
    authLevel.isTechCommitteeHead ||
    authLevel.isPrimary ||
    authLevel.isTechCommitteeDivisionManager;

  return (
    <TechCommitteeApplicationReviewPage
      applicationId={id}
      canTakeActions={canTakeActions}
      managedDivision={authLevel.techCommitteeManagedDivision}
    />
  );
}
