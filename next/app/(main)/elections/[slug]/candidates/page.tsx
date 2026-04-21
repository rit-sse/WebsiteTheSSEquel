import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, GraduationCap, Calendar, UserX } from "lucide-react";
import {
  NeoCard,
  NeoCardHeader,
  NeoCardContent,
} from "@/components/ui/neo-card";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { NominationStatusBadge } from "@/components/elections/NominationStatusBadge";
import {
  compareByPrimaryOrder,
  getElectionWithRelations,
  isTicketDerivedOffice,
} from "@/lib/elections";
import { ElectionAvatar } from "@/components/elections/ElectionAvatar";
import { resolveUserImage } from "@/lib/s3Utils";
import { getAuthLevel } from "@/lib/services/authLevelService";
import type { ElectionNominationStatus } from "@prisma/client";

export default async function ElectionCandidatesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const election = await getElectionWithRelations({ slug });
  if (!election) {
    redirect("/elections");
  }

  const authLevel = await getAuthLevel();
  const currentUserId = authLevel.userId;

  return (
    <section className="election-scope w-full max-w-5xl space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/elections"
          className="hover:text-foreground transition-colors"
        >
          Elections
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/elections/${election.slug}`}
          className="hover:text-foreground transition-colors"
        >
          {election.title}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Candidates</span>
      </nav>

      {/* Per-position cards (VP is ticket-derived; its card is rendered as a
          running-mate chip under each President candidate instead) */}
      {[...election.offices]
        .filter(
          (office) => !isTicketDerivedOffice(office.officerPosition.title)
        )
        .sort((a, b) =>
          compareByPrimaryOrder(
            a.officerPosition.title,
            b.officerPosition.title
          )
        )
        .map((office) => {
        const visibleNominations = office.nominations.filter((nomination) => {
          if (nomination.status === ("ACCEPTED" as ElectionNominationStatus)) {
            return true;
          }
          if (
            nomination.status ===
              ("PENDING_RESPONSE" as ElectionNominationStatus) &&
            currentUserId !== null &&
            nomination.nomineeUserId === currentUserId
          ) {
            return true;
          }
          return false;
        });

        return (
          <NeoCard key={office.id} depth={1}>
            <NeoCardHeader>
              <h2 className="font-display text-2xl">
                {office.officerPosition.title}
              </h2>
            </NeoCardHeader>
            <NeoCardContent>
              {visibleNominations.length === 0 ? (
                <div className="flex items-center gap-3 rounded-lg bg-surface-2 p-4 text-sm text-muted-foreground">
                  <UserX className="h-5 w-5 shrink-0" />
                  <p>No candidates for this position yet.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {visibleNominations.map((nomination) => (
                    <Card
                      key={nomination.id}
                      depth={2}
                      className="space-y-4 p-5"
                    >
                      {/* Avatar + Name + Status */}
                      <div className="flex items-center gap-3">
                        <ElectionAvatar
                          user={{
                            id: nomination.nominee.id,
                            name: nomination.nominee.name,
                            image: resolveUserImage(
                              nomination.nominee.profileImageKey,
                              nomination.nominee.googleImageURL
                            ),
                          }}
                          className="h-16 w-16 border-2 border-black"
                          fallbackClassName="text-lg"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold">
                            {nomination.nominee.name}
                          </p>
                          <NominationStatusBadge
                            status={nomination.status}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {/* Running-mate (VP) chip — only for presidential
                          tickets where the VP has accepted. Uses the
                          design's brutalist "pair" pill. */}
                      {office.officerPosition.title === "President" &&
                        nomination.runningMateInvitation?.status ===
                          "ACCEPTED" && (
                          <div className="flex items-center gap-2">
                            <span className="wvp-label">W/ VP</span>
                            <span className="pair">
                              <ElectionAvatar
                                user={{
                                  id: nomination.runningMateInvitation.invitee
                                    .id,
                                  name: nomination.runningMateInvitation.invitee
                                    .name,
                                  image: resolveUserImage(
                                    nomination.runningMateInvitation.invitee
                                      .profileImageKey,
                                    nomination.runningMateInvitation.invitee
                                      .googleImageURL
                                  ),
                                }}
                                className="h-[18px] w-[18px] border-[1.5px] border-black"
                                fallbackClassName="text-[9px]"
                              />
                              {nomination.runningMateInvitation.invitee.name}
                            </span>
                          </div>
                        )}

                      {/* Eligibility info */}
                      {(nomination.program || nomination.yearLevel) && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                          {nomination.program && (
                            <Tooltip
                              content={<p>Academic program</p>}
                              size="sm"
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <GraduationCap className="h-4 w-4 shrink-0" />
                                {nomination.program}
                              </span>
                            </Tooltip>
                          )}
                          {nomination.yearLevel && (
                            <Tooltip content={<p>Year level</p>} size="sm">
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 shrink-0" />
                                Year {nomination.yearLevel}
                              </span>
                            </Tooltip>
                          )}
                        </div>
                      )}

                      {/* Candidate statement */}
                      {nomination.statement && (
                        <div className="rounded-lg bg-surface-3 p-4">
                          <p className="whitespace-pre-wrap text-sm">
                            {nomination.statement}
                          </p>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </NeoCardContent>
          </NeoCard>
        );
      })}
    </section>
  );
}
