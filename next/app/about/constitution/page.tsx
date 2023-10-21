// This file renders the /about/constitution route of the website.
import { getPostData } from "@/lib/posts";

export default async function Constitution() {
  const postData = await getPostData("https://raw.githubusercontent.com/rit-sse/governing-docs/main/constitution.md");

  //console.log(postData.props.htmlContent);

  return (
    <>
      <div></div>

      <div className = "prose" dangerouslySetInnerHTML={{ __html: postData.props.htmlContent }} />
    </>
  );
}