"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Calendar, CheckCircle2, GraduationCap, UserPlus, Vote } from "lucide-react";

import { NeoCard, NeoCardContent } from "@/components/ui/neo-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ElectionPhaseTimeline } from "@/components/elections/ElectionPhaseTimeline";
import { ElectionAvatar } from "@/components/elections/ElectionAvatar";
import UserSearchInviteModal, {
  type UserSearchResult,
} from "@/components/common/UserSearchInviteModal";

import type {
  NominateData,
  NominateOpenElection,
  NominateOffice,
} from "./types";

interface NominateClientProps {
  data: NominateData;
}

interface ReceiptState {
  position: string;
}

function termLabelFromTitle(title: string): string {
  // Strip the trailing "Primary Officer Election" so the hero shows just
  // the term label ("Spring 2026"), reading like a section name rather
  // than a registry record.
  return title
    .replace(/\s+Primary Officer Election\s*$/i, "")
    .replace(/\s+Election\s*$/i, "")
    .trim();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export default function NominateClient({ data }: NominateClientProps) {
  const { data: session, status: sessionStatus } = useSession();
  const isSignedIn = !!session?.user;

  const [inviteOfficeId, setInviteOfficeId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptState | null>(null);

  const election = data.openElection;
  const nominationsOpen = !!election;

  // Submission helper passed into UserSearchInviteModal. Throws on failure
  // so the modal can surface the inline error; resolves on success and
  // flips the page to the receipt state.
  const submitNomination = useCallback(
    async (officeId: number, nomineeUserId: number) => {
      if (!election) return;
      setSubmitting(true);
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
          const text = await response.text();
          throw new Error(text || "Could not submit your nomination.");
        }
        const office = election.offices.find((o) => o.id === officeId);
        setReceipt({ position: office?.title ?? "an office" });
        toast.success("Nomination submitted.");
      } finally {
        setSubmitting(false);
      }
    },
    [election]
  );

  const inviteOffice =
    election?.offices.find((o) => o.id === inviteOfficeId) ?? null;

  return (
    <div className="w-full max-w-5xl mx-auto py-6 md:py-10 space-y-6 px-2 md:px-0">
      <NeoCard depth={1} className="election-scope w-full">
        <NeoCardContent className="space-y-8 p-6 md:p-8">
          {nominationsOpen && election ? (
            <Hero
              title={`Nominate the next ${termLabelFromTitle(election.title)} officers`}
              subtitle={
                <>
                  {election.offices.length} seat
                  {election.offices.length === 1 ? "" : "s"} to fill. Pick a
                  position, pick a nominee, and ship it. Nominees get an email
                  asking them to accept or decline — you can nominate as many
                  people as you like.
                </>
              }
              badge={
                <>
                  Nominations open · closes {formatDate(election.nominationsCloseAt)}{" "}
                  ({daysUntil(election.nominationsCloseAt)} days)
                </>
              }
            />
          ) : (
            <Hero
              title="The next ballot is being drawn up."
              subtitle={
                <>
                  SSE elects new primary officers each semester. The next
                  nomination window opens with{" "}
                  <strong>{data.nextSemesterLabel}</strong>. Watch this page —
                  no emails, no notifications.
                </>
              }
              badge={`Resumes ${data.nextSemesterLabel}`}
            />
          )}

          {nominationsOpen && election && (
            <PhaseTimelineWrap election={election} />
          )}

          {receipt ? (
            <ReceiptPanel
              receipt={receipt}
              electionSlug={election?.slug ?? ""}
              onAgain={() => {
                setReceipt(null);
                setInviteOfficeId(null);
              }}
            />
          ) : nominationsOpen && election ? (
            !isSignedIn && sessionStatus !== "loading" ? (
              <SignInPanel />
            ) : !data.viewerCanNominate ? (
              <NotMemberPanel />
            ) : (
              <OfficePicker
                offices={election.offices}
                onPick={(officeId) => setInviteOfficeId(officeId)}
              />
            )
          ) : (
            <WaitingPanel nextSemesterLabel={data.nextSemesterLabel} />
          )}
        </NeoCardContent>
      </NeoCard>

      <ExplainerTiles
        isOpen={nominationsOpen}
        closesAt={election ? formatDate(election.nominationsCloseAt) : null}
        votingOpensAt={election ? formatDate(election.votingOpenAt) : null}
      />

      <RoleManifestCard roles={data.roleManifest} />

      {/* Modal — shared site pattern. Opens when user picks an office. */}
      {inviteOffice && election && (
        <UserSearchInviteModal
          open={inviteOfficeId !== null}
          onOpenChange={(open) => {
            if (!open) setInviteOfficeId(null);
          }}
          title={`Nominate for ${inviteOffice.title}`}
          description={
            inviteOffice.title === "President"
              ? "Pick an active SSE member to nominate for President. They'll choose their own VP running mate after accepting — no need to nominate a VP separately."
              : `Pick an active SSE member to nominate for ${inviteOffice.title}. They'll get an email to accept or decline.`
          }
          confirmLabel={submitting ? "Submitting…" : "Send Nomination"}
          onInvite={async (userId) => {
            await submitNomination(inviteOffice.id, userId);
            setInviteOfficeId(null);
          }}
          renderAvatar={(user: UserSearchResult) => (
            <ElectionAvatar
              user={user}
              className="h-9 w-9 border-2 border-black shrink-0"
              fallbackClassName="text-xs"
            />
          )}
          searchPlaceholder="Search SSE members by name or email…"
        />
      )}
    </div>
  );
}

/* ─────────────────── sub-views ─────────────────── */

function Hero({
  badge,
  title,
  subtitle,
}: {
  badge: React.ReactNode;
  title: string;
  subtitle: React.ReactNode;
}) {
  return (
    <header className="space-y-3">
      <Badge variant="default" className="uppercase tracking-wider">
        {badge}
      </Badge>
      <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
        {title}
      </h1>
      <p className="text-base text-muted-foreground max-w-2xl">{subtitle}</p>
    </header>
  );
}

function PhaseTimelineWrap({ election }: { election: NominateOpenElection }) {
  return (
    <div className="rounded-lg border border-border/50 bg-surface-2 p-4">
      <ElectionPhaseTimeline
        status="NOMINATIONS_OPEN"
        nominationsOpenAt={election.nominationsOpenAt}
        nominationsCloseAt={election.nominationsCloseAt}
        votingOpenAt={election.votingOpenAt}
        votingCloseAt={election.votingCloseAt}
      />
    </div>
  );
}

function SignInPanel() {
  return (
    <div className="rounded-lg border-2 border-border bg-surface-2 p-6 md:p-8 text-center space-y-4">
      <h2 className="text-2xl font-display font-bold">Sign in to nominate</h2>
      <p className="text-muted-foreground max-w-xl mx-auto">
        Nominations are member-only. One sign-in with your RIT Google account
        puts the ballot in your hands.
      </p>
      <Button size="lg" onClick={() => signIn("google")}>
        Sign in with RIT Google
      </Button>
    </div>
  );
}

function NotMemberPanel() {
  return (
    <div className="rounded-lg border-2 border-border bg-surface-2 p-6 md:p-8 text-center space-y-3">
      <h2 className="text-2xl font-display font-bold">Membership required</h2>
      <p className="text-muted-foreground max-w-xl mx-auto">
        You&rsquo;re signed in but not on this term&rsquo;s membership rolls.
        Earn a membership at any SSE event, then come back to nominate.
      </p>
      <Button asChild variant="outline">
        <Link href="/about/get-involved">How to become a member</Link>
      </Button>
    </div>
  );
}

function WaitingPanel({ nextSemesterLabel }: { nextSemesterLabel: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-surface-2 p-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild>
          <Link href="/about/get-involved">
            <UserPlus className="mr-2 h-4 w-4" /> Get involved
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/about/leadership">Meet current officers</Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        The next nomination window opens with {nextSemesterLabel}. The page
        below explains who can nominate, who can run, and what each role does.
      </p>
    </div>
  );
}

function OfficePicker({
  offices,
  onPick,
}: {
  offices: NominateOffice[];
  onPick: (officeId: number) => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-display font-bold">
        Pick a position to nominate for
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        {offices.map((office) => (
          <OfficeRow key={office.id} office={office} onPick={onPick} />
        ))}
      </div>
    </div>
  );
}

function OfficeRow({
  office,
  onPick,
}: {
  office: NominateOffice;
  onPick: (officeId: number) => void;
}) {
  return (
    <div className="rounded-lg border-2 border-border bg-surface-2 p-4 space-y-3 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-display font-bold leading-tight">
          {office.title}
        </h3>
        {office.incumbent && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Currently {office.incumbent.name}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground flex-1">
        {office.description}
      </p>
      <Button
        size="sm"
        variant="default"
        onClick={() => onPick(office.id)}
        className="self-start"
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Nominate
      </Button>
    </div>
  );
}

function ReceiptPanel({
  receipt,
  electionSlug,
  onAgain,
}: {
  receipt: ReceiptState;
  electionSlug: string;
  onAgain: () => void;
}) {
  return (
    <div className="rounded-lg border-2 border-success bg-success/10 p-6 space-y-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-6 w-6 text-success shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="text-xl font-display font-bold">
            Nomination submitted
          </h2>
          <p className="text-muted-foreground">
            We&rsquo;ve recorded your nomination for{" "}
            <strong className="text-foreground">{receipt.position}</strong>.
            Your nominee will get an email asking them to accept or decline.
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        {electionSlug && (
          <Button asChild variant="default">
            <Link href={`/elections/${electionSlug}`}>
              <Vote className="mr-2 h-4 w-4" /> View the ballot
            </Link>
          </Button>
        )}
        <Button variant="outline" onClick={onAgain}>
          Nominate someone else
        </Button>
      </div>
    </div>
  );
}

function ExplainerTiles({
  isOpen,
  closesAt,
  votingOpensAt,
}: {
  isOpen: boolean;
  closesAt: string | null;
  votingOpensAt: string | null;
}) {
  const tiles = isOpen
    ? [
        {
          icon: GraduationCap,
          title: "Who can nominate?",
          body: "Any active SSE member — at least one membership earned this term, or last term during the first two weeks of a new one.",
        },
        {
          icon: UserPlus,
          title: "Who can run?",
          body: "Any RIT student who'll stay enrolled through the officer year. Eligibility is reviewed once the nominee accepts.",
        },
        {
          icon: Calendar,
          title: "What happens next?",
          body: closesAt
            ? `Nominations close ${closesAt}. Voting opens ${votingOpensAt ?? "soon after"} and runs for one week — ranked-choice.`
            : "Voting opens after nominations close, and runs for one week using ranked-choice.",
        },
      ]
    : [
        {
          icon: GraduationCap,
          title: "Earn a membership",
          body: "Show up to any SSE event and swipe in. Memberships are tracked term by term — you'll need at least one to nominate or vote.",
        },
        {
          icon: UserPlus,
          title: "Read the constitution",
          body: "Knowing what each role actually does makes you a better nominator (and a better officer if you decide to run).",
        },
        {
          icon: Calendar,
          title: "Watch this page",
          body: "When the next ballot opens, this page lights up. No emails, no notifications — just open it in a tab.",
        },
      ];

  return (
    <NeoCard depth={2} className="w-full">
      <NeoCardContent className="grid gap-4 p-6 md:grid-cols-3">
        {tiles.map((tile) => (
          <div key={tile.title} className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <tile.icon className="h-5 w-5" />
              <h3 className="text-base font-display font-bold">{tile.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{tile.body}</p>
          </div>
        ))}
      </NeoCardContent>
    </NeoCard>
  );
}

function RoleManifestCard({
  roles,
}: {
  roles: NominateData["roleManifest"];
}) {
  return (
    <NeoCard depth={2} className="w-full">
      <NeoCardContent className="p-6 space-y-4">
        <h2 className="text-xl font-display font-bold">The roles</h2>
        <ul className="divide-y divide-border/50">
          {roles.map((role) => (
            <li
              key={role.title}
              className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-bold">{role.title}</span>
                  {!role.onBallot && (
                    <Badge variant="outline" className="text-[10px] uppercase">
                      Running-mate pick
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {role.description}
                </p>
              </div>
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {role.incumbent ? (
                  <>
                    Currently{" "}
                    <span className="text-foreground font-medium">
                      {role.incumbent.name}
                    </span>
                  </>
                ) : (
                  <span>Vacant</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </NeoCardContent>
    </NeoCard>
  );
}
