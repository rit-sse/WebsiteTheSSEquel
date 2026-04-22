"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import DancingLetters from "@/components/common/DancingLetters";
import NeoBrutalistButton from "@/components/neo-brutalist-button";
import { ElectionAvatar } from "@/components/elections/ElectionAvatar";
import type {
  SerializedNomination,
  SerializedRunningMateInvitation,
} from "@/components/elections/types";

interface Props {
  electionId: number;
  electionSlug: string;
  electionTitle: string;
  presidentNomination: SerializedNomination;
  invitation: SerializedRunningMateInvitation;
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

type Step = "decide" | "materials" | "done" | "declined";

export default function RunningMateAcceptClient({
  electionId,
  electionSlug,
  electionTitle,
  presidentNomination,
  invitation,
  responseDeadline,
}: Props) {
  const initialStep: Step =
    invitation.status === "DECLINED" ||
    invitation.status === "EXPIRED" ||
    invitation.status === "WITHDRAWN"
      ? "declined"
      : invitation.status === "ACCEPTED"
        ? "materials"
        : "decide";

  const [step, setStep] = useState<Step>(initialStep);
  const [submitting, setSubmitting] = useState(false);
  const [materials, setMaterials] = useState<MaterialsState>({
    statement: invitation.statement ?? "",
    yearLevel: invitation.yearLevel?.toString() ?? "",
    program: invitation.program ?? "",
    canRemainEnrolledFullYear: invitation.canRemainEnrolledFullYear ?? false,
    canRemainEnrolledNextTerm: invitation.canRemainEnrolledNextTerm ?? false,
    isOnCampus: invitation.isOnCampus ?? false,
    isOnCoop: invitation.isOnCoop ?? false,
  });

  const respond = useCallback(
    async (action: "ACCEPT" | "DECLINE") => {
      setSubmitting(true);
      try {
        const response = await fetch(
          `/api/elections/${electionId}/nominations/${presidentNomination.id}/running-mate/respond`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          }
        );
        if (!response.ok) {
          toast.error((await response.text()) || "Failed to respond");
          return;
        }
        if (action === "ACCEPT") {
          toast.success("You're on the ticket — fill out your profile.");
          setStep("materials");
        } else {
          toast.message("Invitation declined.");
          setStep("declined");
        }
      } catch {
        toast.error("Failed to respond");
      } finally {
        setSubmitting(false);
      }
    },
    [electionId, presidentNomination.id]
  );

  const submitMaterials = useCallback(async () => {
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/elections/${electionId}/nominations/${presidentNomination.id}/running-mate/respond`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ACCEPT",
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
      toast.success("Profile published.");
      setStep("done");
    } catch {
      toast.error("Failed to save materials");
    } finally {
      setSubmitting(false);
    }
  }, [electionId, presidentNomination.id, materials]);

  return (
    <section className="election-scope w-full max-w-4xl space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/elections"
          className="hover:text-foreground transition-colors"
        >
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
        <span className="text-foreground font-medium">
          Your VP invitation
        </span>
      </nav>

      {step === "decide" && (
        <DecideStep
          presidentName={presidentNomination.nominee.name}
          presidentImage={presidentNomination.nominee.image ?? null}
          presidentId={presidentNomination.nominee.id}
          deadlineText={formatDeadline(responseDeadline)}
          submitting={submitting}
          onAccept={() => respond("ACCEPT")}
          onDecline={() => respond("DECLINE")}
        />
      )}

      {step === "materials" && (
        <MaterialsStep
          inviteeName={invitation.invitee.name}
          inviteeId={invitation.invitee.id}
          inviteeImage={invitation.invitee.image ?? null}
          presidentName={presidentNomination.nominee.name}
          materials={materials}
          setMaterials={setMaterials}
          submitting={submitting}
          onSubmit={submitMaterials}
        />
      )}

      {step === "done" && (
        <DoneStep
          electionSlug={electionSlug}
          presidentName={presidentNomination.nominee.name}
        />
      )}

      {step === "declined" && (
        <DeclinedStep
          presidentName={presidentNomination.nominee.name}
          onUndo={() => setStep("decide")}
        />
      )}
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/* Steps                                                                  */
/* ---------------------------------------------------------------------- */

function DecideStep({
  presidentName,
  presidentImage,
  presidentId,
  deadlineText,
  submitting,
  onAccept,
  onDecline,
}: {
  presidentName: string;
  presidentImage: string | null;
  presidentId: number;
  deadlineText: string;
  submitting: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <NeoCard depth={1}>
      <NeoCardContent className="space-y-8 p-6 pb-10 md:p-10 md:pb-12">
        <div className="space-y-6">
          <p className="eyebrow">You&rsquo;ve been invited to run</p>
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold leading-tight text-left md:text-4xl">
              {presidentName} wants you on the ticket as
            </h1>
            <DancingLetters
              text="Vice President"
              className="justify-start text-6xl md:text-7xl lg:text-8xl"
              letterClassName="text-6xl md:text-7xl lg:text-8xl font-display font-bold leading-none text-primary"
            />
          </div>

          <p className="text-muted-foreground max-w-prose">
            Accept and you&rsquo;re on the presidential ticket — voters who pick{" "}
            {presidentName} for President are automatically picking you for VP
            too. You have until{" "}
            <strong className="text-foreground">{deadlineText}</strong> to
            accept or decline.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card depth={2} className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Invited by
            </p>
            <div className="mt-3 flex items-center gap-3">
              <ElectionAvatar
                user={{
                  id: presidentId,
                  name: presidentName,
                  image: presidentImage,
                }}
                className="h-8 w-8 border-2 border-black"
                fallbackClassName="text-[11px]"
              />
              <span className="text-sm font-medium">{presidentName}</span>
              <Badge variant="outline">President nominee</Badge>
            </div>
          </Card>

          <Card depth={2} className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              What happens next
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Accept to lock in your seat on the ticket.
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Fill in your bio, program, and eligibility — they show on
                your candidate card next to {presidentName}.
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                If the ticket wins, you become Vice President.
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
            <CheckCircle className="h-4 w-4" /> Accept &amp; continue
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

function MaterialsStep({
  inviteeName,
  inviteeId,
  inviteeImage,
  presidentName,
  materials,
  setMaterials,
  submitting,
  onSubmit,
}: {
  inviteeName: string;
  inviteeId: number;
  inviteeImage: string | null;
  presidentName: string;
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
            Your VP candidate profile
          </NeoCardTitle>
        </NeoCardHeader>
        <NeoCardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="statement">Short bio</Label>
            <Textarea
              id="statement"
              rows={5}
              placeholder={`A couple of sentences — who you are and why you're running with ${presidentName}.`}
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
            <ElectionAvatar
              user={{ id: inviteeId, name: inviteeName, image: inviteeImage }}
              className="h-16 w-16 border-2 border-black"
              fallbackClassName="text-lg"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold">{inviteeName}</p>
              <Badge className="mt-1" variant="outline">
                Vice President
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
  presidentName,
}: {
  electionSlug: string;
  presidentName: string;
}) {
  return (
    <NeoCard depth={1}>
      <NeoCardContent className="space-y-4 p-8 text-center">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-black bg-emerald-500 text-white shadow-[4px_4px_0_0_black]">
            <CheckCircle className="h-7 w-7" />
          </div>
        </div>
        <h2 className="font-display text-2xl font-bold">
          You&rsquo;re on the ticket.
        </h2>
        <p className="mx-auto max-w-prose text-sm text-muted-foreground">
          Members can now see you alongside {presidentName} on their candidate
          card. Edit your materials any time before voting opens.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            href={`/elections/${electionSlug}`}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            Back to election <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </NeoCardContent>
    </NeoCard>
  );
}

function DeclinedStep({
  presidentName,
  onUndo,
}: {
  presidentName: string;
  onUndo: () => void;
}) {
  return (
    <NeoCard depth={1}>
      <NeoCardContent className="space-y-4 p-8 text-center">
        <h2 className="font-display text-2xl font-bold">
          Invitation declined.
        </h2>
        <p className="mx-auto max-w-prose text-sm text-muted-foreground">
          You&rsquo;ve declined the running-mate invitation from{" "}
          {presidentName}. Thanks for letting them know.
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
