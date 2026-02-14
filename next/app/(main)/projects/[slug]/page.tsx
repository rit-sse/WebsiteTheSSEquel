import { notFound } from "next/navigation";

import LexicalRichText from "@/components/cms/LexicalRichText";
import { Card } from "@/components/ui/card";
import { getPayloadClient } from "@/lib/payload";

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProjectContentPage({ params }: Params) {
  const { slug } = await params;
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "projects",
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
    depth: 0,
  });

  const content = result.docs[0];

  if (!content) {
    notFound();
  }

  return (
    <section className="w-full py-8 px-4 md:px-8">
      <div className="max-w-screen-xl mx-auto">
        <Card depth={1} className="p-6 md:p-8 space-y-4">
          <h1 className="text-primary">{String(content.title || "Project")}</h1>
          {content.description ? (
            <p className="text-muted-foreground">{String(content.description)}</p>
          ) : null}
          <LexicalRichText data={content.content} className="prose max-w-none" />
        </Card>
      </div>
    </section>
  );
}
