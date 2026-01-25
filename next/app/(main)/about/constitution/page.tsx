// This file renders the /about/constitution route of the website.
import { getPostData } from "@/lib/posts";

export default async function Constitution() {
  const postData = await getPostData("https://raw.githubusercontent.com/rit-sse/governing-docs/main/constitution.md");

  return (
    <section>
      <div className="text-page-structure">
          <div dangerouslySetInnerHTML={{ __html: postData.props.htmlContent }} />
      </div>
    </section>
  );
}