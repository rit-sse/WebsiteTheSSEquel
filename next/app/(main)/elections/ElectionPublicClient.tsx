"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  NeoCard,
  NeoCardContent,
} from "@/components/ui/neo-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ElectionAvatar } from "@/components/elections/ElectionAvatar";
import { Tooltip } from "@/components/ui/tooltip";
import { ElectionStatusBadge } from "@/components/elections/ElectionStatusBadge";
import { ElectionPhaseTimeline } from "@/components/elections/ElectionPhaseTimeline";
import { NominationStatusBadge } from "@/components/elections/NominationStatusBadge";
import RunningMateInviteCard, {
  type RunningMateInvitation,
} from "@/components/elections/RunningMateInviteCard";
import UserInviteSlot from "@/components/common/UserInviteSlot";
import UserSearchInviteModal, {
  type UserSearchResult as ModalUserSearchResult,
} from "@/components/common/UserSearchInviteModal";
import NeoBrutalistButton from "@/components/neo-brutalist-button";
import ElectionDevTweaks from "@/components/elections/ElectionDevTweaks";
import {
  ChevronRight,
  Vote,
  Shield,
  Trophy,
  Info,
  CheckCircle,
  GraduationCap,
  Calendar,
  UserX,
} from "lucide-react";
import type {
  SerializedElection,
  SerializedElectionOffice,
  SerializedNomination,
  UserRef,
} from "@/components/elections/types";
import {
  compareByPrimaryOrder,
  isTicketDerivedOffice,
} from "@/lib/elections";

/* ---------- Props ---------- */

interface Props {
  election: SerializedElection;
  currentUserId: number | null;
  canNominate: boolean;
  isMember: boolean;
  isPrimary: boolean;
  isSeAdmin: boolean;
  isPresident: boolean;
}

/* ---------- Nomination response form state ---------- */

interface NominationResponseState {
  statement: string;
  yearLevel: string;
  program: string;
  canRemainEnrolledFullYear: boolean;
  canRemainEnrolledNextTerm: boolean;
  isOnCampus: boolean;
  isOnCoop: boolean;
}

function defaultResponseState(
  nomination: SerializedNomination
): NominationResponseState {
  return {
    statement: nomination.statement ?? "",
    yearLevel: nomination.yearLevel?.toString() ?? "",
    program: nomination.program ?? "",
    canRemainEnrolledFullYear: nomination.canRemainEnrolledFullYear ?? false,
    canRemainEnrolledNextTerm: nomination.canRemainEnrolledNextTerm ?? false,
    isOnCampus: nomination.isOnCampus ?? false,
    isOnCoop: nomination.isOnCoop ?? false,
  };
}

/* ---------- My nomination with office info ---------- */

interface MyNomination extends SerializedNomination {
  officeTitle: string;
}

/* ========================================================================== */

export default function ElectionPublicClient({
  election,
  currentUserId,
  canNominate,
  isMember,
  isPrimary,
  isSeAdmin,
  isPresident,
}: Props) {
  /* ---- Nomination invite state ----
   * Mirrors the officer-invite flow: an "Invite" button per office
   * opens a shared `<UserSearchInviteModal>` with the office pre-
   * selected, then POSTs to the nominations endpoint on submit. */
  const [inviteOfficeId, setInviteOfficeId] = useState<number | null>(null);
  const [submittingNomination, setSubmittingNomination] = useState(false);

  /* ---- Nomination response state ---- */
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [responseState, setResponseState] = useState<
    Record<number, NominationResponseState>
  >({});
  const [dismissedNominations, setDismissedNominations] = useState<Set<number>>(
    () => new Set()
  );

  /* ---- Derived data ---- */
  const myNominations: MyNomination[] = election.offices.flatMap(
    (office: SerializedElectionOffice) =>
      office.nominations
        .filter(
          (n: SerializedNomination) =>
            n.nomineeUserId === currentUserId &&
            n.status === "PENDING_RESPONSE" &&
            !dismissedNominations.has(n.id)
        )
        .map((n: SerializedNomination) => ({
          ...n,
          officeTitle: office.officerPosition.title,
        }))
  );

  /* ---- Amendment 12: accepted presidential nominations owned by me — I get
       a running-mate invite panel for each ---- */
  const myAcceptedPresidentNominations: MyNomination[] = election.offices
    .filter(
      (office: SerializedElectionOffice) =>
        office.officerPosition.title === "President"
    )
    .flatMap((office: SerializedElectionOffice) =>
      office.nominations
        .filter(
          (n: SerializedNomination) =>
            n.nomineeUserId === currentUserId && n.status === "ACCEPTED"
        )
        .map((n: SerializedNomination) => ({
          ...n,
          officeTitle: office.officerPosition.title,
        }))
    );

  /* ---- Amendment 12: inbound running-mate invitations addressed to me ---- */
  interface InboundRunningMateInvite {
    nominationId: number;
    status: string;
    expiresAt: string;
    presidentNomineeName: string;
  }
  const inboundRunningMateInvites: InboundRunningMateInvite[] =
    election.offices
      .filter(
        (office: SerializedElectionOffice) =>
          office.officerPosition.title === "President"
      )
      .flatMap((office: SerializedElectionOffice) =>
        office.nominations
          .filter((n: SerializedNomination) => {
            const inv = n.runningMateInvitation;
            return (
              inv &&
              inv.inviteeUserId === currentUserId &&
              inv.status === "INVITED"
            );
          })
          .map((n: SerializedNomination) => ({
            nominationId: n.id,
            status: n.runningMateInvitation!.status,
            expiresAt: n.runningMateInvitation!.expiresAt,
            presidentNomineeName: n.nominee.name,
          }))
      );

  const respondToRunningMateInvite = useCallback(
    async (
      nominationId: number,
      action: "ACCEPT" | "DECLINE"
    ) => {
      try {
        const response = await fetch(
          `/api/elections/${election.id}/nominations/${nominationId}/running-mate/respond`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          }
        );
        if (!response.ok) {
          toast.error(
            (await response.text()) ||
              "Failed to respond to running-mate invite"
          );
          return;
        }
        toast.success(
          action === "ACCEPT"
            ? "You're now running as VP on this ticket"
            : "Invitation declined"
        );
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      } catch {
        toast.error("Failed to respond to running-mate invite");
      }
    },
    [election.id]
  );

  const totalNominations = election.offices.reduce(
    (acc: number, o: SerializedElectionOffice) => acc + o.nominations.length,
    0
  );

  const hasVoted = election.ballots.some(
    (b) => b.voterId === currentUserId
  );

  /* ---- Handlers ---- */

  /** Submit a nomination from inside `UserSearchInviteModal`. Throws on
   * failure so the modal stays open; resolves on success, at which
   * point the page reloads to pick up the new server state. */
  const submitNominationForOffice = useCallback(
    async (officeId: number, nomineeUserId: number) => {
      setSubmittingNomination(true);
      try {
        const response = await fetch(
          `/api/elections/${election.id}/nominations`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              electionOfficeId: officeId,
              nomineeUserId,
            }),
          }
        );
        if (!response.ok) {
          const msg =
            (await response.text()) || "Failed to submit nomination";
          toast.error(msg);
          throw new Error(msg);
        }
        toast.success("Nomination submitted");
        // Reload so the freshly-created pending slot renders with
        // server-truth data (avoids hand-rolled optimistic merging).
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      } finally {
        setSubmittingNomination(false);
      }
    },
    [election.id]
  );

  const getResponseForNomination = useCallback(
    (nominationId: number, nomination: SerializedNomination) => {
      if (responseState[nominationId]) return responseState[nominationId];
      return defaultResponseState(nomination);
    },
    [responseState]
  );

  const updateResponse = useCallback(
    (nominationId: number, patch: Partial<NominationResponseState>) => {
      setResponseState((prev) => ({
        ...prev,
        [nominationId]: {
          ...(prev[nominationId] ?? defaultResponseState({} as SerializedNomination)),
          ...patch,
        },
      }));
    },
    []
  );

  const respondToNomination = useCallback(
    async (
      nomination: MyNomination,
      status: "ACCEPTED" | "DECLINED"
    ) => {
      const nominationId = nomination.id;
      setRespondingId(nominationId);
      try {
        const state = getResponseForNomination(nominationId, nomination);
        const payload: Record<string, unknown> = { status };
        if (status === "ACCEPTED") {
          payload.statement = state.statement;
          payload.yearLevel = state.yearLevel
            ? Number(state.yearLevel)
            : null;
          payload.program = state.program || null;
          payload.canRemainEnrolledFullYear = state.canRemainEnrolledFullYear;
          payload.canRemainEnrolledNextTerm = state.canRemainEnrolledNextTerm;
          payload.isOnCampus = state.isOnCampus;
          payload.isOnCoop = state.isOnCoop;
        }
        const response = await fetch(
          `/api/elections/${election.id}/nominations/${nominationId}/respond`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (!response.ok) {
          throw new Error((await response.text()) || "Failed to respond");
        }
        toast.success(`Nomination ${status.toLowerCase()}`);
        setDismissedNominations((prev) => new Set(prev).add(nominationId));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to respond"
        );
      } finally {
        setRespondingId(null);
      }
    },
    [election.id, getResponseForNomination]
  );

  /* ---- Conditional flags ---- */
  const isNominationsOpen = election.status === "NOMINATIONS_OPEN";
  const isVotingOpen = election.status === "VOTING_OPEN";
  const isCertified = election.status === "CERTIFIED";
  const isUser = currentUserId !== null;
  const showNominationForm = isNominationsOpen && canNominate;

  /* ========================================================================= */

  return (
    <NeoCard depth={1} className="election-scope w-full">
      <NeoCardContent className="space-y-6 p-6 md:p-8">
      {/* ---- Breadcrumbs ---- */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/elections" className="hover:text-foreground transition-colors">
          Elections
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{election.title}</span>
      </nav>

      {/* ---- Header ---- */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-display font-bold">{election.title}</h1>
          <ElectionStatusBadge status={election.status} />
          {election.status === "VOTING_OPEN" && (
            <span
              className="live-badge"
              aria-label="Voting is live"
              title="Voting is live"
            >
              <span className="live-dot" />
              Live
            </span>
          )}
        </div>
        {election.description && (
          <p className="text-base text-muted-foreground">
            {election.description}
          </p>
        )}
        <ElectionPhaseTimeline
          status={election.status}
          nominationsOpenAt={election.nominationsOpenAt}
          nominationsCloseAt={election.nominationsCloseAt}
          votingOpenAt={election.votingOpenAt}
          votingCloseAt={election.votingCloseAt}
          certifiedAt={election.certifiedAt}
        />
      </div>

      {/* ---- NOMINATION FORM ----
           Mirrors the officer-invite pattern from /dashboard/positions:
           one slot per office, with empty dashed → yellow pending →
           filled accepted states. Clicking "Invite" opens the shared
           `<UserSearchInviteModal>` pre-selected to that office. */}
      {showNominationForm && (
        <div id="nomination-form">
          <div className="mb-6 space-y-1">
            <h2 className="text-2xl font-display font-bold">
              Nominate a Candidate
            </h2>
            <p className="text-muted-foreground">
              Invite any SSE member to run for an open position — you can
              also nominate yourself. Nominations start in the{" "}
              <em>pending</em> state until the nominee accepts.
            </p>
          </div>
          <div className="space-y-5">
            {[...election.offices]
              // VP is ticket-derived — chosen as a running mate by the
              // presidential nominee, not nominated directly.
              .filter(
                (office: SerializedElectionOffice) =>
                  office.officerPosition.title !== "Vice President"
              )
              .sort((a, b) =>
                compareByPrimaryOrder(
                  a.officerPosition.title,
                  b.officerPosition.title
                )
              )
              .map((office: SerializedElectionOffice) => {
                // Only surface the CURRENT user's outbound nominations
                // to this office — active ones only (no declined /
                // expired clutter). Gives the slot pattern per-office
                // the same "you own this slot" vibe as the officer page.
                const myOutbound = office.nominations.filter(
                  (n: SerializedNomination) =>
                    n.nominatorUserId === currentUserId &&
                    (n.status === "PENDING_RESPONSE" ||
                      n.status === "ACCEPTED")
                );
                const isPresidentOffice =
                  office.officerPosition.title === "President";

                return (
                  <div key={office.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">
                        {office.officerPosition.title}
                      </h3>
                      {isPresidentOffice && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Info className="h-3 w-3 shrink-0" />
                          VP is chosen by the President&rsquo;s ticket
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {myOutbound.map((nomination) => {
                        const isAccepted = nomination.status === "ACCEPTED";
                        const avatar = (
                          <ElectionAvatar
                            user={nomination.nominee}
                            className={
                              isAccepted
                                ? "h-8 w-8 border-2 border-black"
                                : "h-8 w-8 border-2 border-amber-500 ring-2 ring-amber-200 dark:ring-amber-700/40"
                            }
                            fallbackClassName="text-xs"
                          />
                        );
                        return (
                          <UserInviteSlot
                            key={nomination.id}
                            user={
                              isAccepted
                                ? {
                                    primary: nomination.nominee.name,
                                    secondary: "Accepted the nomination",
                                    avatar,
                                  }
                                : null
                            }
                            pendingInvitation={
                              isAccepted
                                ? null
                                : {
                                    primary: nomination.nominee.name,
                                    secondary:
                                      "Awaiting nominee response",
                                    avatar,
                                    badgeLabel: "Invited",
                                  }
                            }
                            emptyLabel=""
                            inviteLabel=""
                            onInvite={() => {}}
                            readOnly
                          />
                        );
                      })}
                      <UserInviteSlot
                        user={null}
                        pendingInvitation={null}
                        emptyLabel={
                          myOutbound.length > 0
                            ? "Nominate another candidate"
                            : "No nominee invited yet"
                        }
                        inviteLabel={
                          myOutbound.length > 0 ? "Invite another" : "Invite"
                        }
                        onInvite={() => setInviteOfficeId(office.id)}
                        disabled={submittingNomination}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Nomination invite modal — shared with the officer-invite flow. */}
      {(() => {
        const inviteOffice = inviteOfficeId
          ? election.offices.find(
              (o: SerializedElectionOffice) => o.id === inviteOfficeId
            )
          : null;
        const inviteOfficeTitle =
          inviteOffice?.officerPosition.title ?? "this office";
        const isPresidentInvite = inviteOfficeTitle === "President";
        return (
          <UserSearchInviteModal
            open={inviteOfficeId !== null}
            onOpenChange={(open) => {
              if (!open) setInviteOfficeId(null);
            }}
            title={`Nominate for ${inviteOfficeTitle}`}
            description={
              isPresidentInvite
                ? "Your nominee will pick their own VP running mate after accepting — no need to nominate a VP separately."
                : `Pick an active SSE member to nominate for ${inviteOfficeTitle}. They'll get an email to accept or decline.`
            }
            confirmLabel="Send Nomination"
            onInvite={async (userId) => {
              if (!inviteOfficeId) return;
              await submitNominationForOffice(inviteOfficeId, userId);
            }}
            renderAvatar={(user: ModalUserSearchResult) => (
              <ElectionAvatar
                user={user}
                className="h-9 w-9 border-2 border-black shrink-0"
                fallbackClassName="text-xs"
              />
            )}
            searchPlaceholder="Search SSE members by name or email…"
          />
        );
      })()}

      {/* ---- VOTING CTA (full-width, prominent when voting open) ---- */}
      {isVotingOpen && isMember && (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <Vote className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-display font-bold">
              {hasVoted ? "You've voted!" : "Voting is open"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {hasVoted
                ? "You can update your ballot until voting closes."
                : "Cast your ranked-choice ballot for each position. Rank candidates in order of preference."}
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href={`/elections/${election.slug}/vote`}>
              <Vote className="mr-2 h-4 w-4" />
              {hasVoted ? "Update Ballot" : "Vote Now"}
            </Link>
          </Button>
        </div>
      )}

      {/* Non-member notice */}
      {!isMember && isUser && (
        <div className="flex items-center gap-3 rounded-lg border-l-4 border-l-amber-500 bg-amber-50/50 p-4 dark:bg-amber-900/20">
          <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            You must be an SSE member to nominate candidates and vote.
          </p>
        </div>
      )}

      {/* ---- Your Nominations (pending response) ----
           The full accept + materials + running-mate flow lives on
           /elections/[slug]/respond/[nominationId]. Here we just surface
           the pending-response banner with a button that jumps there. */}
      {myNominations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold">Your Nominations</h2>
          {myNominations.map((nomination) => (
            <Card key={nomination.id} depth={2} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="eyebrow">You&rsquo;ve been nominated</p>
                    <NominationStatusBadge status={nomination.status} />
                  </div>
                  <p className="mt-1 font-display text-lg font-bold">
                    {nomination.officeTitle}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Accept or decline on the dedicated response page.
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link
                    href={`/elections/${election.slug}/respond/${nomination.id}`}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Respond
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ---- Amendment 12: inbound running-mate invites ---- */}
      {inboundRunningMateInvites.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold">
            Running-Mate Invitations
          </h2>
          {inboundRunningMateInvites.map((invite) => (
            <Card key={invite.nominationId} depth={2}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>
                    {invite.presidentNomineeName} invited you to run as VP
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Accept to appear on the presidential ticket. If the ticket
                  wins, you become Vice President.
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-4">
                <NeoBrutalistButton
                  text="Accept"
                  variant="green"
                  size="sm"
                  icon={<CheckCircle className="h-4 w-4" />}
                  onClick={() =>
                    respondToRunningMateInvite(invite.nominationId, "ACCEPT")
                  }
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    respondToRunningMateInvite(invite.nominationId, "DECLINE")
                  }
                >
                  Decline
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ---- Amendment 12: my accepted presidential ticket(s) ---- */}
      {myAcceptedPresidentNominations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold">
            Your Presidential Ticket
          </h2>
          {myAcceptedPresidentNominations.map((nomination) => {
            const invitation =
              (nomination.runningMateInvitation as
                | RunningMateInvitation
                | null
                | undefined) ?? null;
            return (
              <RunningMateInviteCard
                key={nomination.id}
                electionId={election.id}
                nominationId={nomination.id}
                invitation={invitation}
                onChange={() => {
                  // Force a refetch of the election so the invitation state
                  // is always fresh. The simplest thing here is a full page
                  // refresh since the server components own the data.
                  if (typeof window !== "undefined") {
                    window.location.reload();
                  }
                }}
              />
            );
          })}
        </div>
      )}

      {/* ---- Inline stats ---- */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span>
          <strong className="text-foreground font-display text-base">{totalNominations}</strong> nominations
        </span>
        <span>
          <strong className="text-foreground font-display text-base">{election.ballots.length}</strong> ballots cast
        </span>
        <span>
          <strong className="text-foreground font-display text-base">{election.offices.length}</strong> positions
        </span>
        <Tooltip
          content={
            <p>
              Instant Runoff Voting: Voters rank candidates in order of
              preference. The candidate with the fewest votes is eliminated
              each round until a winner emerges.
            </p>
          }
          size="lg"
        >
          <span className="underline decoration-dotted cursor-help">
            IRV voting system
          </span>
        </Tooltip>
        {(isPresident || isSeAdmin) && (
          <Link
            href={`/dashboard/elections/${election.id}`}
            className="text-primary hover:underline ml-auto"
          >
            {isPresident ? "Manage" : "Review"}
          </Link>
        )}
      </div>

      {/* ---- Prominent Results CTA ----
           Show to everyone once certified, and to admins/presidents as soon
           as voting is closed so they can review the tally before certifying. */}
      {(isCertified ||
        ((isSeAdmin || isPresident) &&
          election.status === "VOTING_CLOSED")) && (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="eyebrow inline-flex items-center gap-2 justify-center">
            <Trophy className="h-3 w-3" />{" "}
            {isCertified
              ? "Final · Certified"
              : "Preliminary · Pending certification"}
          </p>
          <p className="font-display text-lg font-bold">
            {isCertified
              ? "Your new officers have been chosen."
              : "Round-by-round results are ready."}
          </p>
          <p className="max-w-prose text-sm text-muted-foreground">
            {isCertified
              ? "Take a moment to meet the winners, then dig into the round-by-round tally."
              : election.status === "VOTING_CLOSED" && isSeAdmin
                ? "Review every office before you certify — certification publishes the results."
                : "The SE Office will certify these results shortly."}
          </p>
          <NeoBrutalistButton
            text={isCertified ? "See who won" : "View results"}
            variant="orange"
            icon={<Trophy className="h-[18px] w-[18px]" />}
            href={
              isCertified
                ? `/elections/${election.slug}/reveal`
                : `/elections/${election.slug}/results`
            }
          />
        </div>
      )}

      {/* ---- Positions & Candidates (full width) ----
           All the candidate detail that used to live on the dedicated
           /candidates page is now rendered inline — statement, program,
           year level, and (for President) the running-mate VP as a
           co-equal ticket-mate. VP's own office is ticket-derived, so
           it never appears as a standalone card here. */}
      <div className="grid gap-4 md:grid-cols-2">
          {[...election.offices]
            .filter(
              (office) => !isTicketDerivedOffice(office.officerPosition.title)
            )
            .sort((a: SerializedElectionOffice, b: SerializedElectionOffice) =>
              compareByPrimaryOrder(
                a.officerPosition.title,
                b.officerPosition.title
              )
            )
            .map((office: SerializedElectionOffice) => {
            const acceptedNominations = office.nominations.filter(
              (n: SerializedNomination) => n.status === "ACCEPTED"
            );
            const candidateCount = acceptedNominations.length;
            const isPresidentOffice =
              office.officerPosition.title === "President";

            return (
              <div key={office.id} className="space-y-3">
                <div className="space-y-1.5">
                  <h3 className="font-display text-xl font-bold leading-none tracking-tight">
                    {office.officerPosition.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {candidateCount === 0
                      ? "No candidates yet"
                      : candidateCount === 1
                        ? "1 candidate"
                        : `${candidateCount} candidates`}
                  </p>
                </div>
                <div className="space-y-4">
                  {candidateCount === 0 && (
                    <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
                      <UserX className="h-5 w-5 shrink-0" />
                      <p>
                        {isNominationsOpen
                          ? "Nominations are still open for this position."
                          : "No candidates have been nominated for this position."}
                      </p>
                    </div>
                  )}
                  {acceptedNominations.map(
                    (nomination: SerializedNomination) => {
                      const runningMate =
                        isPresidentOffice &&
                        nomination.runningMateInvitation?.status === "ACCEPTED"
                          ? nomination.runningMateInvitation.invitee
                          : null;
                      return (
                        <Card
                          key={nomination.id}
                          depth={2}
                          className="space-y-4 p-5"
                        >
                          <CandidateBlock
                            nominee={nomination.nominee}
                            statement={nomination.statement}
                            program={nomination.program}
                            yearLevel={nomination.yearLevel}
                            status={nomination.status}
                          />
                          {runningMate && (
                            <RunningMateBlock runningMate={runningMate} />
                          )}
                        </Card>
                      );
                    }
                  )}
                </div>
              </div>
            );
          })}
      </div>
      </NeoCardContent>
      <ElectionDevTweaks
        electionId={election.id}
        currentStatus={election.status}
        canAccess={isSeAdmin}
      />
    </NeoCard>
  );
}

/* ========================================================================= */
/* Candidate rendering helpers                                               */
/* ========================================================================= */

/**
 * Inline candidate block — what used to live on /elections/[slug]/candidates.
 * Renders everything a voter needs to evaluate the nominee without leaving
 * the election overview: big avatar, name + status, eligibility chips
 * (program / year), and the full candidate statement.
 */
function CandidateBlock({
  nominee,
  statement,
  program,
  yearLevel,
  status,
}: {
  nominee: UserRef;
  statement: string;
  program: string | null;
  yearLevel: number | null;
  status: SerializedNomination["status"];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <ElectionAvatar
          user={nominee}
          className="h-16 w-16 border-2 border-black"
          fallbackClassName="text-lg"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{nominee.name}</p>
          <NominationStatusBadge status={status} className="mt-1" />
        </div>
      </div>
      {(program || yearLevel) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          {program && (
            <Tooltip content={<p>Academic program</p>} size="sm">
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 shrink-0" />
                {program}
              </span>
            </Tooltip>
          )}
          {yearLevel && (
            <Tooltip content={<p>Year level</p>} size="sm">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 shrink-0" />
                Year {yearLevel}
              </span>
            </Tooltip>
          )}
        </div>
      )}
      {statement && (
        <div className="rounded-lg bg-muted/40 p-4">
          <p className="whitespace-pre-wrap text-sm">{statement}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Amendment 12 ticket view: render the president's running mate with the
 * same visual weight as the presidential nominee. VPs don't have their
 * own statement/program/year (they were invited, not nominated) so the
 * block degrades to avatar + name + a "Running mate" eyebrow + context
 * note — still a first-class candidate, just with lighter metadata.
 */
function RunningMateBlock({ runningMate }: { runningMate: UserRef }) {
  return (
    <div className="relative rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4">
      <p className="eyebrow mb-3">Vice President · Running mate</p>
      <div className="flex items-center gap-3">
        <ElectionAvatar
          user={runningMate}
          className="h-16 w-16 border-2 border-black"
          fallbackClassName="text-lg"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{runningMate.name}</p>
          <Badge variant="outline" className="mt-1">
            Accepted
          </Badge>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        A vote for the presidential ticket is a vote for this pair. If the
        ticket wins, they take office together.
      </p>
    </div>
  );
}
