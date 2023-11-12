// This file renders the /about/constitution route of the website.
import { getPostData } from "@/lib/posts";

export default async function Constitution() {
  const postData = await getPostData("https://raw.githubusercontent.com/rit-sse/governing-docs/main/constitution.md");

  //console.log(postData.props.htmlContent);

  return (
    <section>
      <div className="flex flex-col items-center">
        <div className="mx-auto px-4 sm: py-16 md:pb-8 lg:max-w-6xl">
          <div dangerouslySetInnerHTML={{ __html: postData.props.htmlContent }} />
        </div>
      </div>
    </section>
  );
}