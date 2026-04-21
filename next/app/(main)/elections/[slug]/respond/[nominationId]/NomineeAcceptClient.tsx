"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  CheckCircle,
  ChevronRight,
  Info,
  Rocket,
  Undo2,
  X,
} from "lucide-react";
import {
  NeoCard,
  NeoCardContent,
  NeoCardHeader,
  NeoCardTitle,
} from "@/components/ui/neo-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import NeoBrutalistButton from "@/components/neo-brutalist-button";
import RunningMateInviteCard, {
  type RunningMateInvitation,
} from "@/components/elections/RunningMateInviteCard";
import { electionAvatarStyle } from "@/components/elections/electionAvatarColor";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { SerializedNomination } from "@/components/elections/types";

interface Props {
  electionId: number;
  electionSlug: string;
  electionTitle: string;
  officeTitle: string;
  nomination: SerializedNomination;
  nominators: { id: number; name: string }[];
  responseDeadline: string;
}

interface MaterialsState {
  statement: string;
  yearLevel: string;
  program: string;
  canRemainEnrolledFullYear: boolean;
  canRemainEnrolledNextTerm: boolean;
  isOnCampus: boolean;
  isOnCoop: boolean;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Grammatical article: "a President" vs "an SE Admin". */
function articleFor(title: string): string {
  const first = title.trim()[0]?.toLowerCase();
  return first && "aeiou".includes(first) ? "an" : "a";
}

function formatDeadline(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

type Step = "decide" | "running-mate" | "materials" | "done" | "declined";

export default function NomineeAcceptClient({
  electionId,
  electionSlug,
  electionTitle,
  officeTitle,
  nomination,
  nominators,
  responseDeadline,
}: Props) {
  const isPresident = officeTitle === "President";

  const initialStep: Step =
    nomination.status === "DECLINED"
      ? "declined"
      : nomination.status === "ACCEPTED"
        ? isPresident && !nomination.runningMateInvitation
          ? "running-mate"
          : "materials"
        : "decide";

  const [step, setStep] = useState<Step>(initialStep);
  const [submitting, setSubmitting] = useState(false);
  const [materials, setMaterials] = useState<MaterialsState>({
    statement: nomination.statement ?? "",
    yearLevel: nomination.yearLevel?.toString() ?? "",
    program: nomination.program ?? "",
    canRemainEnrolledFullYear: nomination.canRemainEnrolledFullYear ?? false,
    canRemainEnrolledNextTerm: nomination.canRemainEnrolledNextTerm ?? false,
    isOnCampus: nomination.isOnCampus ?? false,
    isOnCoop: nomination.isOnCoop ?? false,
  });
  const [runningMate, setRunningMate] = useState<RunningMateInvitation | null>(
    nomination.runningMateInvitation
      ? {
          id: nomination.runningMateInvitation.id,
          status: nomination.runningMateInvitation.status,
          expiresAt: nomination.runningMateInvitation.expiresAt,
          invitee: {
            id: nomination.runningMateInvitation.invitee.id,
            name: nomination.runningMateInvitation.invitee.name,
            email: nomination.runningMateInvitation.invitee.email,
          },
        }
      : null
  );

  const nominatorText = useMemo(() => {
    const names = nominators.map((n) => n.name);
    if (names.length === 0) return "Members of the SSE";
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
  }, [nominators]);

  const article = articleFor(officeTitle);

  const respond = useCallback(
    async (status: "ACCEPTED" | "DECLINED") => {
      setSubmitting(true);
      try {
        const response = await fetch(
          `/api/elections/${electionId}/nominations/${nomination.id}/respond`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status,
              // Nothing to send yet — the materials step collects these.
              statement: "",
              yearLevel: null,
              program: null,
              canRemainEnrolledFullYear: false,
              canRemainEnrolledNextTerm: false,
              isOnCampus: false,
              isOnCoop: false,
            }),
          }
        );
        if (!response.ok) {
          toast.error((await response.text()) || "Failed to respond");
          return;
        }
        if (status === "ACCEPTED") {
          toast.success(`Nomination accepted — you're on the ballot.`);
          setStep(isPresident ? "running-mate" : "materials");
        } else {
          toast.message("Nomination declined.");
          setStep("declined");
        }
      } catch {
        toast.error("Failed to respond");
      } finally {
        setSubmitting(false);
      }
    },
    [electionId, nomination.id, isPresident]
  );

  const submitMaterials = useCallback(async () => {
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/elections/${electionId}/nominations/${nomination.id}/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "ACCEPTED",
            statement: materials.statement,
            yearLevel: materials.yearLevel
              ? Number(materials.yearLevel)
              : null,
            program: materials.program || null,
            canRemainEnrolledFullYear: materials.canRemainEnrolledFullYear,
            canRemainEnrolledNextTerm: materials.canRemainEnrolledNextTerm,
            isOnCampus: materials.isOnCampus,
            isOnCoop: materials.isOnCoop,
          }),
        }
      );
      if (!response.ok) {
        toast.error((await response.text()) || "Failed to save materials");
        return;
      }
      toast.success("Materials published.");
      setStep("done");
    } catch {
      toast.error("Failed to save materials");
    } finally {
      setSubmitting(false);
    }
  }, [electionId, nomination.id, materials]);

  return (
    <section className="election-scope w-full max-w-4xl space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/elections" className="hover:text-foreground transition-colors">
          Elections
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/elections/${electionSlug}`}
          className="hover:text-foreground transition-colors"
        >
          {electionTitle}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Your nomination</span>
      </nav>

      {step === "decide" && (
        <DecideStep
          article={article}
          officeTitle={officeTitle}
          nominatorText={nominatorText}
          nominators={nominators}
          deadlineText={formatDeadline(responseDeadline)}
          submitting={submitting}
          onAccept={() => respond("ACCEPTED")}
          onDecline={() => respond("DECLINED")}
        />
      )}

      {step === "running-mate" && (
        <RunningMateStep
          electionId={electionId}
          nominationId={nomination.id}
          invitation={runningMate}
          onUpdated={(inv) => {
            setRunningMate(inv);
            // If they accepted/invited and want to move on, let them.
          }}
          onContinue={() => setStep("materials")}
        />
      )}

      {step === "materials" && (
        <MaterialsStep
          officeTitle={officeTitle}
          nomineeName={nomination.nominee.name}
          nomineeId={nomination.nomineeUserId}
          materials={materials}
          setMaterials={setMaterials}
          submitting={submitting}
          onSubmit={submitMaterials}
        />
      )}

      {step === "done" && (
        <DoneStep
          electionSlug={electionSlug}
          officeTitle={officeTitle}
          isPresident={isPresident}
        />
      )}

      {step === "declined" && (
        <DeclinedStep
          officeTitle={officeTitle}
          onUndo={async () => {
            // Bounce the status back to PENDING via accept — the user
            // can then re-choose. The respond endpoint doesn't support
            // un-declining directly, so this is a convenience bounce.
            setStep("decide");
          }}
        />
      )}
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/* Steps                                                                   */
/* ---------------------------------------------------------------------- */

function DecideStep({
  article,
  officeTitle,
  nominatorText,
  nominators,
  deadlineText,
  submitting,
  onAccept,
  onDecline,
}: {
  article: string;
  officeTitle: string;
  nominatorText: string;
  nominators: { id: number; name: string }[];
  deadlineText: string;
  submitting: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <NeoCard depth={1}>
      <NeoCardContent className="space-y-8 p-6 pb-10 md:p-10 md:pb-12">
        <div className="space-y-6">
          <p className="eyebrow">You&rsquo;ve been nominated</p>
          <h1 className="font-display text-3xl font-bold leading-tight text-left md:text-4xl">
            The SSE thinks you&rsquo;d make {article} <em>great</em>{" "}
            {officeTitle}
          </h1>
          <p className="text-muted-foreground max-w-prose">
            {nominatorText} {nominators.length === 1 ? "thinks" : "think"} you&rsquo;d
            be a great {officeTitle}. You have until{" "}
            <strong className="text-foreground">{deadlineText}</strong> to accept
            or decline. Nominations auto-expire after the deadline.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card depth={2} className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Nominated by
            </p>
            <ul className="mt-3 space-y-2">
              {nominators.map((n) => (
                <li key={n.id} className="flex items-center gap-3">
                  <Avatar
                    className="h-8 w-8 border-2 border-black"
                    style={electionAvatarStyle(n.id)}
                  >
                    <AvatarFallback
                      className="font-display text-[11px] font-bold"
                      style={electionAvatarStyle(n.id)}
                    >
                      {getInitials(n.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{n.name}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card depth={2} className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              What happens next
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Accept to appear on the {officeTitle} ballot.
              </li>
              {officeTitle === "President" && (
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  Pick a VP running mate (they get an email to accept).
                </li>
              )}
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Fill in your bio, photo, and platform — these show on your
                candidate card.
              </li>
            </ul>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Button
            onClick={onAccept}
            disabled={submitting}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" /> Accept & continue
          </Button>
          <Button
            variant="outline"
            onClick={onDecline}
            disabled={submitting}
            className="gap-2"
          >
            <X className="h-4 w-4" /> Decline
          </Button>
          <p className="text-sm text-muted-foreground">
            Expires <strong className="text-foreground">{deadlineText}</strong>
          </p>
        </div>
      </NeoCardContent>
    </NeoCard>
  );
}

function RunningMateStep({
  electionId,
  nominationId,
  invitation,
  onUpdated: _onUpdated,
  onContinue,
}: {
  electionId: number;
  nominationId: number;
  invitation: RunningMateInvitation | null;
  onUpdated: (inv: RunningMateInvitation | null) => void;
  onContinue: () => void;
}) {
  const hasActiveInvite =
    invitation &&
    (invitation.status === "INVITED" || invitation.status === "ACCEPTED");

  return (
    <NeoCard depth={1}>
      <NeoCardHeader>
        <NeoCardTitle className="text-2xl">Pick your VP</NeoCardTitle>
      </NeoCardHeader>
      <NeoCardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          As the presidential nominee, you pick your VP running mate. The SSE
          will email them automatically with an accept/decline link. You can
          swap your running mate any time before voting opens.
        </p>
        <RunningMateInviteCard
          electionId={electionId}
          nominationId={nominationId}
          invitation={invitation}
          onChange={() => {
            if (typeof window !== "undefined") window.location.reload();
          }}
        />
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <p className="text-xs text-muted-foreground">
            {hasActiveInvite
              ? "Great — you can also update your platform next."
              : "You can skip this and come back after voting opens."}
          </p>
          <NeoBrutalistButton
            text="Next · platform"
            variant="blue"
            size="sm"
            icon={<ArrowRight className="h-4 w-4" />}
            onClick={onContinue}
          />
        </div>
      </NeoCardContent>
    </NeoCard>
  );
}

function MaterialsStep({
  officeTitle,
  nomineeName,
  nomineeId,
  materials,
  setMaterials,
  submitting,
  onSubmit,
}: {
  officeTitle: string;
  nomineeName: string;
  nomineeId: number;
  materials: MaterialsState;
  setMaterials: React.Dispatch<React.SetStateAction<MaterialsState>>;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const patch = (p: Partial<MaterialsState>) =>
    setMaterials((prev) => ({ ...prev, ...p }));

  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <NeoCard depth={1}>
        <NeoCardHeader>
          <p className="eyebrow">Step · Platform</p>
          <NeoCardTitle className="text-2xl">
            Your candidate profile
          </NeoCardTitle>
        </NeoCardHeader>
        <NeoCardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="statement">Short bio</Label>
            <Textarea
              id="statement"
              rows={5}
              placeholder="A couple of sentences — who you are and why you're running."
              value={materials.statement}
              onChange={(e) => patch({ statement: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              {materials.statement.length}/280
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="year">Year level</Label>
              <Input
                id="year"
                type="number"
                placeholder="e.g. 3"
                value={materials.yearLevel}
                onChange={(e) => patch({ yearLevel: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="program">Program</Label>
              <Input
                id="program"
                placeholder="e.g. Software Engineering"
                value={materials.program}
                onChange={(e) => patch({ program: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                [
                  "canRemainEnrolledFullYear",
                  "Can remain enrolled full academic year",
                ],
                [
                  "canRemainEnrolledNextTerm",
                  "Can remain enrolled next term",
                ],
                ["isOnCampus", "On campus at RIT Henrietta"],
                ["isOnCoop", "On co-op during the term"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center gap-3">
                <Checkbox
                  id={key}
                  checked={materials[key]}
                  onCheckedChange={(v) => patch({ [key]: Boolean(v) })}
                />
                <Label htmlFor={key} className="cursor-pointer text-sm">
                  {label}
                </Label>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <NeoBrutalistButton
              text="Publish"
              variant="pink"
              icon={<Rocket className="h-[18px] w-[18px]" />}
              onClick={onSubmit}
              disabled={submitting || materials.statement.trim().length === 0}
            />
            <p className="text-xs text-muted-foreground">
              You can edit this any time before voting opens.
            </p>
          </div>
        </NeoCardContent>
      </NeoCard>

      {/* Live preview */}
      <div className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <p className="eyebrow">Live preview</p>
        <p className="text-xs text-muted-foreground">
          This is what members see on the candidates page.
        </p>
        <Card depth={2} className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <Avatar
              className="h-16 w-16 border-2 border-black"
              style={electionAvatarStyle(nomineeId)}
            >
              <AvatarFallback
                className="font-display text-lg font-bold"
                style={electionAvatarStyle(nomineeId)}
              >
                {getInitials(nomineeName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold">{nomineeName}</p>
              <Badge className="mt-1" variant="outline">
                {officeTitle}
              </Badge>
            </div>
          </div>
          <div className="rounded-lg bg-surface-3 p-4">
            <p className="whitespace-pre-wrap text-sm">
              {materials.statement || (
                <span className="text-muted-foreground">
                  Your bio appears here…
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            {materials.program && <span>{materials.program}</span>}
            {materials.yearLevel && <span>Year {materials.yearLevel}</span>}
          </div>
        </Card>
        <div className="rounded-lg border-2 border-black bg-surface-2 p-3">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Changes save on publish. Your card updates in real time.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DoneStep({
  electionSlug,
  officeTitle,
  isPresident,
}: {
  electionSlug: string;
  officeTitle: string;
  isPresident: boolean;
}) {
  return (
    <NeoCard depth={1}>
      <NeoCardContent className="space-y-4 p-8 text-center">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-black bg-emerald-500 text-white shadow-[4px_4px_0_0_black]">
            <CheckCircle className="h-7 w-7" />
          </div>
        </div>
        <h2 className="font-display text-2xl font-bold">You&rsquo;re on the ballot.</h2>
        <p className="mx-auto max-w-prose text-sm text-muted-foreground">
          Members can now see your {officeTitle} candidate card.{" "}
          {isPresident
            ? "Your running mate will receive an email shortly."
            : "Edit your materials any time before voting opens."}
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            href={`/elections/${electionSlug}`}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            Back to election <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/elections/${electionSlug}/candidates`}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            View candidates <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </NeoCardContent>
    </NeoCard>
  );
}

function DeclinedStep({
  officeTitle,
  onUndo,
}: {
  officeTitle: string;
  onUndo: () => void;
}) {
  return (
    <NeoCard depth={1}>
      <NeoCardContent className="space-y-4 p-8 text-center">
        <h2 className="font-display text-2xl font-bold">
          Nomination declined.
        </h2>
        <p className="mx-auto max-w-prose text-sm text-muted-foreground">
          You&rsquo;ve declined your nomination for {officeTitle}. Thanks for
          letting the SSE know.
        </p>
        <div className="flex justify-center pt-2">
          <Button variant="outline" className="gap-2" onClick={onUndo}>
            <Undo2 className="h-4 w-4" /> Changed your mind? Undo decline
          </Button>
        </div>
      </NeoCardContent>
    </NeoCard>
  );
}
