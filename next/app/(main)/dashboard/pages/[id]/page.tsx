import { notFound, redirect } from "next/navigation";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { getPageById } from "@/lib/services/pageService";
import { PageEditorClient } from "./PageEditorClient";
import { PageContentSchema, EMPTY_PAGE_CONTENT } from "@/lib/pageBuilder/blocks";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export default async function PageEditorRoute({ params }: RouteProps) {
  const auth = await getAuthLevel();
  if (!auth.isOfficer && !auth.isSeAdmin) redirect("/");
  const { id: idStr } = await params;
  const id = Number.parseInt(idStr, 10);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const page = await getPageById(id);
  if (!page) notFound();

  const parsed = PageContentSchema.safeParse(page.draftContent);
  const draftContent = parsed.success ? parsed.data : EMPTY_PAGE_CONTENT;

  return (
    <PageEditorClient
      page={{
        id: page.id,
        slug: page.slug,
        title: page.title,
        status: page.status,
        systemLocked: page.systemLocked,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        showInNav: page.showInNav,
        navSection: page.navSection,
        navLabel: page.navLabel,
        navOrder: page.navOrder,
        updatedAt: page.updatedAt.toISOString(),
        publishedAt: page.publishedAt?.toISOString() ?? null,
      }}
      initialContent={draftContent}
      isPrimary={auth.isPrimary || auth.isSeAdmin}
    />
  );
}
