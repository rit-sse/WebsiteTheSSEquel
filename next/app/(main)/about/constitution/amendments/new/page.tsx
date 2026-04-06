import Link from "next/link";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { NeoCard } from "@/components/ui/neo-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, LogIn, UserPlus } from "lucide-react";
import AmendmentBreadcrumb from "@/components/amendments/AmendmentBreadcrumb";
import AmendmentWizard from "@/components/amendments/AmendmentWizard";

async function getConstitutionSource(): Promise<string> {
  const response = await fetch(
    "https://raw.githubusercontent.com/rit-sse/governing-docs/main/constitution.md",
    { cache: "no-store" },
  );
  if (!response.ok) {
    return "# Constitution\n\nFailed to load constitution draft.";
  }
  return response.text();
}

export default async function NewAmendmentPage() {
  const authLevel = await getAuthLevel();
  const constitutionText = await getConstitutionSource();

  if (!authLevel.isMember) {
    return (
      <section className="w-full max-w-6xl px-2 md:px-4">
        <AmendmentBreadcrumb items={[{ label: "New Proposal" }]} />
        <NeoCard depth={1} className="p-6 md:p-8">
          <Card depth={2} className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="rounded-full bg-primary/8 p-4 mb-5">
              {authLevel.isUser ? (
                <UserPlus className="h-8 w-8 text-primary/40" strokeWidth={1.5} />
              ) : (
                <LogIn className="h-8 w-8 text-primary/40" strokeWidth={1.5} />
              )}
            </div>
            <h2 className="font-display text-xl font-semibold mb-2">
              {authLevel.isUser
                ? "Membership Required"
                : "Sign In Required"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              {authLevel.isUser
                ? "You must be an active SSE member to propose constitution amendments. Members can propose, discuss, and vote on changes to the governing documents."
                : "Sign in with your RIT account to propose amendments to the SSE constitution."}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {authLevel.isUser ? (
                <Button asChild>
                  <Link href="/memberships">Learn About Membership</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/api/auth/signin">Sign In</Link>
                </Button>
              )}
              <Button asChild variant="neutral">
                <Link href="/about/constitution">Read the Constitution</Link>
              </Button>
            </div>
          </Card>
        </NeoCard>
      </section>
    );
  }

  return (
    <section className="w-full max-w-6xl px-2 md:px-4">
      <AmendmentBreadcrumb items={[{ label: "New Proposal" }]} />

      {/* Page header */}
      <div className="py-4">
        <h1 className="text-3xl font-display font-bold tracking-tight">
          Propose an Amendment
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Walk through the steps below to propose a change to the SSE constitution
        </p>
      </div>

      {/* Wizard in NeoCard */}
      <NeoCard depth={1} className="p-4 md:p-6">
        <AmendmentWizard initialContent={constitutionText} />
      </NeoCard>
    </section>
  );
}
