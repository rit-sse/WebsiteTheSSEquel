import CommitteeHeadNominationAcceptClient from "./CommitteeHeadNominationAcceptClient";

export const dynamic = "force-dynamic";

export default async function CommitteeHeadNominationAcceptPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  return <CommitteeHeadNominationAcceptClient applicationId={applicationId} />;
}
