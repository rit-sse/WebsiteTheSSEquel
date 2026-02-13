import { Card } from "@/components/ui/card";
import { getPostData } from "@/lib/posts";

export default async function PrimaryOfficersPolicy() {
  const postData = await getPostData("https://raw.githubusercontent.com/rit-sse/governing-docs/refs/heads/main/primary-officers-policy.md");

  return (
    <section>
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