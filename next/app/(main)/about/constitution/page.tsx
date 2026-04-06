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
      <div className="text-page-structure">
        <Card depth={1} className="w-full p-6 md:p-8">
          <div className="flex flex-wrap gap-3 justify-between items-start mb-6">
            <h1 className="font-display text-3xl font-bold tracking-tight">SSE Constitution</h1>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" asChild>
                <Link href="/about/constitution/amendments">Active Amendments</Link>
              </Button>
              {authLevel.isMember ? (
                <Button asChild>
                  <Link href="/about/constitution/amendments/new">Propose Amendment</Link>
                </Button>
              ) : null}
            </div>
          </div>
          <div
            className="prose prose-lg dark:prose-invert max-w-none [&>h1:first-child]:hidden"
            dangerouslySetInnerHTML={{ __html: postData.props.htmlContent }}
          />
        </Card>
      </div>
    </section>
  );
}