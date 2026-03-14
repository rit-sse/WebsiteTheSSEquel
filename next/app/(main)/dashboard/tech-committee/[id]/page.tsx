import TechCommitteeApplicationReviewPage from "./review-page";

export default async function TechCommitteeApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TechCommitteeApplicationReviewPage applicationId={id} />;
}
