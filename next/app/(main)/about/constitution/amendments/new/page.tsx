import Link from "next/link";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { Button } from "@/components/ui/button";
import ConstitutionEditor from "@/components/amendments/ConstitutionEditor";

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
        <div className="py-6">
          <h1 className="text-3xl font-display font-bold">Propose an Amendment</h1>
          <p className="mt-4 text-muted-foreground">
            You must be an active member to propose constitution amendments.
          </p>
          <Button asChild className="mt-4">
            <Link href="/about/constitution">Return to Constitution</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-6xl px-2 md:px-4">
      <div className="py-4">
        <h1 className="text-3xl font-display font-bold">Propose an Amendment</h1>
        <p className="mt-2 text-muted-foreground">
          Edit the file below and submit to open a pull request to the governing-docs repository.
        </p>
      </div>
      <ConstitutionEditor initialContent={constitutionText} />
    </section>
  );
}
