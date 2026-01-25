import Image from 'next/image'
import { CTAButton } from '@/components/common/CTAButton';
import { getPostData } from "@/lib/posts";

export default async function PrimaryOfficersPolicy() {
  const postData = await getPostData("https://raw.githubusercontent.com/rit-sse/governing-docs/refs/heads/main/primary-officers-policy.md");

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