// This file renders the /about/constitution route of the website.
import { getPostData } from "@/lib/posts";

export default async function Constitution() {
    const postData = await getPostData("poop.md");
  
    return (
      <div dangerouslySetInnerHTML={{ __html: postData.props.htmlContent }} />
    );
}