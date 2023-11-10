import Image from 'next/image'
import { CTAButton } from '@/components/common/CTAButton';
import { getPostData } from "@/lib/posts";

export default async function PrimaryOfficersPolicy() {
    const postData = await getPostData("https://raw.githubusercontent.com/rit-sse/governing-docs/main/primary-officers-policy.md");

  return (
      <div dangerouslySetInnerHTML={{ __html: postData.props.htmlContent }} />
  );        
}