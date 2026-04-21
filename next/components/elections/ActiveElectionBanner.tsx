import Link from "next/link";
import prisma from "@/lib/prisma";
import { ElectionStatusBadge } from "./ElectionStatusBadge";
import { Vote, Users, Send } from "lucide-react";
import type { ElectionStatus } from "@prisma/client";

const ACTIVE_STATUSES: ElectionStatus[] = [
  "NOMINATIONS_OPEN",
  "NOMINATIONS_CLOSED",
  "VOTING_OPEN",
  "VOTING_CLOSED",
];

const STATUS_CTA: Record<
  string,
  { icon: React.ReactNode; text: string; label: string }
> = {
  NOMINATIONS_OPEN: {
    icon: <Send className="h-4 w-4" />,
    text: "Nominations are open",
    label: "Nominate",
  },
  NOMINATIONS_CLOSED: {
    icon: <Users className="h-4 w-4" />,
    text: "Nominations closed — voting begins soon",
    label: "View",
  },
  VOTING_OPEN: {
    icon: <Vote className="h-4 w-4" />,
    text: "Voting is open",
    label: "Vote Now",
  },
  VOTING_CLOSED: {
    icon: <Vote className="h-4 w-4" />,
    text: "Voting has closed — results pending",
    label: "View",
  },
};

export async function ActiveElectionBanner() {
  const election = await prisma.election.findFirst({
    where: { status: { in: ACTIVE_STATUSES } },
    select: { id: true, title: true, slug: true, status: true },
    orderBy: { createdAt: "desc" },
  });

  if (!election) return null;

  const cta = STATUS_CTA[election.status] ?? STATUS_CTA.VOTING_CLOSED;

  return (
    // `mt-20` clears the 80px-tall fixed navbar (`Navbar` is
    // `fixed top-0` with `z-50` — without this margin the banner
    // tucks underneath the nav). The banner carries the same heavy
    // `border-b-[2px] border-black` as the navbar so its separator
    // line reads as a continuation of the nav's own border rather
    // than a lighter secondary divider.
    //
    // Surface: `bg-card` is the shadcn-native sibling-surface token —
    // a touch darker than the page `bg-background`, which gives the
    // strip clean definition without the washed-out tinted-blue look
    // of the old `bg-primary/10`. The CTA icon takes `text-primary`
    // so there's a single crisp blue accent pulling the eye, while
    // the status badge keeps its semantic palette (shared with the
    // rest of the election pages).
    <Link
      href={`/elections/${election.slug}`}
      className="group block w-full bg-card hover:bg-muted transition-colors border-b-[2px] border-black mt-20"
    >
      <div className="flex items-center justify-center gap-3 px-4 py-2.5 text-sm">
        <span className="flex items-center gap-2">
          <span className="text-primary">{cta.icon}</span>
          <span className="font-medium">{cta.text}</span>
          <span className="text-muted-foreground hidden sm:inline">
            — {election.title}
          </span>
        </span>
        <ElectionStatusBadge status={election.status} />
      </div>
    </Link>
  );
}
