import { redirect } from "next/navigation";
import { getElectionWithRelations } from "@/lib/elections";
import ElectionVoteClient from "./ElectionVoteClient";

export default async function ElectionVotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const election = await getElectionWithRelations({ slug });
  if (!election) {
    redirect("/elections");
  }

  return <ElectionVoteClient electionId={election.id} />;
}

