import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ChevronRight,
  CheckCircle,
  Clock,
  Pencil,
  Vote,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { resolveUserImage } from "@/lib/s3Utils";
import {
  NeoCard,
  NeoCardContent,
} from "@/components/ui/neo-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ElectionAvatar } from "@/components/elections/ElectionAvatar";
import { NominationStatusBadge } from "@/components/elections/NominationStatusBadge";

export const dynamic = "force-dynamic";

/**
 * Personal landing page for everything a member is currently in the
 * middle of in any election: outstanding nominations to respond to,
 * accepted nominations whose candidate profile they may want to edit,
 * and any inbound VP running-mate invitations.
 *
 * Linked from the profile dropdown so accepted candidates can find
 * their own profile after the initial accept flow ends — there's no
 * other entry point that surfaces the per-nomination edit URL once the
 * "respond now" banner on the election page disappears.
 */
export default async function MyElectionsPage() {
  const authLevel = await getAuthLevel();
  if (!authLevel.userId) {
    redirect("/login?callbackUrl=/elections/me");
  }
  const userId = authLevel.userId;

  // Pull every nomination + invitation for this user across every
  // election in a single pass. We deliberately don't filter by election
  // status — even past elections are fine to surface (they'll just have
  // greyed-out edit buttons), but we sort active first.
  const [nominations, runningMateInvites] = await Promise.all([
    prisma.electionNomination.findMany({
      where: {
        nomineeUserId: userId,
        status: { in: ["PENDING_RESPONSE", "ACCEPTED"] },
      },
      include: {
        electionOffice: {
          include: {
            election: {
              select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                votingOpenAt: true,
              },
            },
            officerPosition: { select: { title: true } },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    }),
    prisma.electionRunningMateInvitation.findMany({
      where: {
        inviteeUserId: userId,
        status: { in: ["INVITED", "ACCEPTED"] },
      },
      include: {
        presidentNomination: {
          include: {
            nominee: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImageKey: true,
                googleImageURL: true,
              },
            },
            electionOffice: {
              include: {
                election: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    status: true,
                    votingOpenAt: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    }),
  ]);

  return (
    <section className="election-scope w-full max-w-4xl space-y-8">
      <NeoCard depth={1}>
        <NeoCardContent className="space-y-6 p-6 md:p-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/elections"
              className="hover:text-foreground transition-colors"
            >
              Elections
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">Your nominations</span>
          </nav>

          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold">
              Your nominations &amp; invitations
            </h1>
            <p className="text-sm text-muted-foreground">
              Everything you&rsquo;re currently in the middle of across all
              elections. Edit your candidate profile or respond to outstanding
              invitations from here.
            </p>
            {/* Surface the per-election profile sync so candidates running
                for more than one office (very common in primaries) don't
                think they need to re-type their bio per role. */}
            {(() => {
              const positionsByElection = new Map<number, number>();
              for (const n of nominations) {
                const eid = n.electionOffice.election.id;
                positionsByElection.set(
                  eid,
                  (positionsByElection.get(eid) ?? 0) + 1
                );
              }
              for (const i of runningMateInvites) {
                const eid =
                  i.presidentNomination.electionOffice.election.id;
                positionsByElection.set(
                  eid,
                  (positionsByElection.get(eid) ?? 0) + 1
                );
              }
              const hasMultiInAnyElection = Array.from(
                positionsByElection.values()
              ).some((c) => c > 1);
              if (!hasMultiInAnyElection) return null;
              return (
                <p className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2 inline-flex items-center gap-2">
                  <Pencil className="h-3.5 w-3.5 shrink-0" />
                  You&rsquo;re running for more than one office in the same
                  election — your bio, program, year, and eligibility are
                  shared across all of those positions, so editing once
                  updates them everywhere.
                </p>
              );
            })()}
          </div>

          {/* ─── Nominations (you've been nominated for an office) ─── */}
          <div className="space-y-3">
            <h2 className="font-display text-xl font-bold">
              Nominations
            </h2>
            {nominations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You don&rsquo;t have any open nominations right now.
              </p>
            ) : (
              <div className="space-y-3">
                {nominations.map((nomination) => {
                  const election = nomination.electionOffice.election;
                  const isAccepted = nomination.status === "ACCEPTED";
                  return (
                    <Card
                      key={nomination.id}
                      depth={2}
                      className="space-y-3 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="eyebrow inline-flex items-center gap-2">
                            {isAccepted ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                Accepted &mdash; on the ballot
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3" />
                                Awaiting your response
                              </>
                            )}
                          </p>
                          <p className="mt-1 font-display text-lg font-bold">
                            {nomination.electionOffice.officerPosition.title}{" "}
                            <span className="text-sm font-normal text-muted-foreground">
                              &middot; {election.title}
                            </span>
                          </p>
                          <NominationStatusBadge
                            status={nomination.status}
                            className="mt-1"
                          />
                        </div>
                        <Button asChild size="sm">
                          <Link
                            href={`/elections/${election.slug}/respond/${nomination.id}`}
                          >
                            {isAccepted ? (
                              <>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit profile
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Respond
                              </>
                            )}
                          </Link>
                        </Button>
                      </div>
                      {isAccepted && nomination.statement && (
                        <p className="line-clamp-2 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                          {nomination.statement}
                        </p>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── VP running-mate invitations ─── */}
          <div className="space-y-3">
            <h2 className="font-display text-xl font-bold">
              Running-mate invitations
            </h2>
            {runningMateInvites.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nobody has invited you to be their VP running mate.
              </p>
            ) : (
              <div className="space-y-3">
                {runningMateInvites.map((invite) => {
                  const election =
                    invite.presidentNomination.electionOffice.election;
                  const president = invite.presidentNomination.nominee;
                  const presidentImage = resolveUserImage(
                    president.profileImageKey,
                    president.googleImageURL
                  );
                  const isAccepted = invite.status === "ACCEPTED";
                  return (
                    <Card key={invite.id} depth={2} className="space-y-3 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="eyebrow inline-flex items-center gap-2">
                            {isAccepted ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                Accepted &mdash; on the presidential ticket
                              </>
                            ) : (
                              <>
                                <Vote className="h-3 w-3" />
                                Invited to run as VP
                              </>
                            )}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <ElectionAvatar
                              user={{
                                id: president.id,
                                name: president.name,
                                image: presidentImage,
                              }}
                              className="h-6 w-6 border-2 border-black"
                              fallbackClassName="text-[10px]"
                            />
                            <p className="font-display text-lg font-bold">
                              with {president.name}{" "}
                              <span className="text-sm font-normal text-muted-foreground">
                                &middot; {election.title}
                              </span>
                            </p>
                          </div>
                        </div>
                        <Button asChild size="sm">
                          <Link
                            href={`/elections/${election.slug}/respond/running-mate/${invite.presidentNominationId}`}
                          >
                            {isAccepted ? (
                              <>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit profile
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Respond
                              </>
                            )}
                          </Link>
                        </Button>
                      </div>
                      {isAccepted && invite.statement && (
                        <p className="line-clamp-2 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                          {invite.statement}
                        </p>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </NeoCardContent>
      </NeoCard>
    </section>
  );
}
