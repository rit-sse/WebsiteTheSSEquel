import { notFound } from "next/navigation";

import LexicalRichText from "@/components/cms/LexicalRichText";
import { Card } from "@/components/ui/card";
import { getPayloadClient } from "@/lib/payload";

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CMSPage({ params }: Params) {
  const { slug } = await params;
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "pages",
    where: {
      slug: {
        equals: slug,
      },
      status: {
        equals: "published",
      },
    },
    limit: 1,
    depth: 1,
  });

  const page = result.docs[0];

  if (!page) {
    notFound();
  }

  return (
    <section className="w-full py-8 px-4 md:px-8">
      <div className="max-w-screen-xl mx-auto">
        <Card depth={1} className="p-6 md:p-8 space-y-4">
          <h1 className="text-primary">{String(page.title || "Page")}</h1>
          {page.excerpt ? (
            <p className="text-muted-foreground">{String(page.excerpt)}</p>
          ) : null}
          <LexicalRichText data={page.content} className="prose max-w-none" />
        </Card>
      </div>
    </section>
  );
}
