import Link from "next/link";
import { FileText, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Role =
  | "seAdmin"
  | "primary"
  | "officer"
  | "member"
  | "signedIn"
  | "anonymous";

type AmendmentEmptyStateProps = {
  role: Role;
  /** Optional context like the current status filter */
  filterLabel?: string;
};

const messages: Record<
  Role,
  { heading: string; description: string; cta?: { label: string; href: string }; icon: typeof FileText }
> = {
  seAdmin: {
    heading: "No amendments yet",
    description:
      "No constitutional amendments have been proposed yet. As SE Admin, you'll manage the full amendment lifecycle once proposals are submitted.",
    icon: FileText,
  },
  primary: {
    heading: "No amendments match this filter",
    description:
      "As a primary officer, you can encourage members to propose amendments to improve our governing documents.",
    icon: FileText,
  },
  officer: {
    heading: "No amendments are currently open",
    description:
      "As an officer, you can propose amendments and participate in community discussion once amendments are submitted.",
    cta: { label: "Propose Amendment", href: "/about/constitution/amendments/new" },
    icon: FileText,
  },
  member: {
    heading: "No amendments found",
    description:
      "Have an idea to improve our constitution? Start a proposal and let the community weigh in.",
    cta: { label: "Propose Amendment", href: "/about/constitution/amendments/new" },
    icon: FileText,
  },
  signedIn: {
    heading: "No amendments found",
    description:
      "You're signed in but not yet a member. Members can propose amendments, vote, and join the discussion.",
    cta: { label: "Learn About Membership", href: "/memberships" },
    icon: UserPlus,
  },
  anonymous: {
    heading: "No amendments are currently listed",
    description:
      "The SSE uses a democratic process to update our constitution. Sign in to participate in governance.",
    cta: { label: "Sign In to Participate", href: "/api/auth/signin" },
    icon: LogIn,
  },
};

export default function AmendmentEmptyState({ role, filterLabel }: AmendmentEmptyStateProps) {
  const config = messages[role];
  const Icon = config.icon;

  return (
    <Card depth={3} className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="rounded-full bg-primary/8 p-4 mb-5">
        <Icon className="h-8 w-8 text-primary/40" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-2">
        {filterLabel ? `No ${filterLabel.toLowerCase()} amendments` : config.heading}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-6">
        {config.description}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        {config.cta && (
          <Button asChild>
            <Link href={config.cta.href}>{config.cta.label}</Link>
          </Button>
        )}
        <Button asChild variant="neutral">
          <Link href="/about/constitution">Read the Constitution</Link>
        </Button>
      </div>
    </Card>
  );
}
