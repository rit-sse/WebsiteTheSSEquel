import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getPayloadClient } from "@/lib/payload";

export default async function CMSPagesIndex() {
  const payload = await getPayloadClient();

  const pages = await payload.find({
    collection: "pages",
    where: {
      status: {
        equals: "published",
      },
    },
    limit: 50,
    sort: "-updatedAt",
    depth: 0,
  });

  return (
    <section className="w-full py-8 px-4 md:px-8">
      <div className="max-w-screen-xl mx-auto">
        <Card depth={1} className="p-6 md:p-8 space-y-4">
          <h1 className="text-primary">Pages</h1>
          {pages.docs.length === 0 ? (
            <p className="text-muted-foreground">No published pages yet.</p>
          ) : (
            <ul className="space-y-3">
              {pages.docs.map((page) => (
                <li key={String(page.id)} className="border-b border-border pb-2">
                  <Link
                    href={`/pages/${String(page.slug)}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {String(page.title)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </section>
  );
}
