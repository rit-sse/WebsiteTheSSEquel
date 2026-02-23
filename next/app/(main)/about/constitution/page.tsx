// This file renders the /about/constitution route of the website.
import { Card } from "@/components/ui/card";
import { getPostData } from "@/lib/posts";
import { getAuthLevel } from "@/lib/services/authLevelService";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Constitution() {
  const authLevel = await getAuthLevel();
  const postData = await getPostData("https://raw.githubusercontent.com/rit-sse/governing-docs/main/constitution.md");

  return (
    <section>
      <div className="mb-4 w-full px-2 md:px-0 max-w-6xl">
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="neutral" asChild>
            <Link href="/about/constitution/amendments">Active Amendments</Link>
          </Button>
          {authLevel.isMember ? (
            <Button asChild>
              <Link href="/about/constitution/amendments/new">Propose Amendment</Link>
            </Button>
          ) : null}
        </div>
      </div>
      <div className="text-page-structure">
        <Card depth={1} className="w-full p-6 md:p-8">
          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: postData.props.htmlContent }}
          />
        </Card>
      </div>
    </section>
  );
}