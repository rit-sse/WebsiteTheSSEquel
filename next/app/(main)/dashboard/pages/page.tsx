import { redirect } from "next/navigation";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { listPagesForDashboard } from "@/lib/services/pageService";
import { PagesListClient } from "./PagesListClient";

export const dynamic = "force-dynamic";

export default async function PagesIndex() {
  const auth = await getAuthLevel();
  if (!auth.isOfficer && !auth.isSeAdmin) {
    redirect("/");
  }
  const pages = await listPagesForDashboard();
  return (
    <PagesListClient
      initialPages={pages.map((p) => ({
        ...p,
        publishedAt: p.publishedAt?.toISOString() ?? null,
        updatedAt: p.updatedAt.toISOString(),
        archivedAt: p.archivedAt?.toISOString() ?? null,
      }))}
      canCreate={auth.isPrimary || auth.isSeAdmin}
    />
  );
}
