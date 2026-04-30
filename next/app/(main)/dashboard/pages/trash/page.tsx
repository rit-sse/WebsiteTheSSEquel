import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Trash2 } from "lucide-react";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { listArchivedPages } from "@/lib/services/pageService";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrashListClient } from "./TrashListClient";

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  const auth = await getAuthLevel();
  if (!auth.isOfficer && !auth.isSeAdmin) redirect("/");
  const pages = await listArchivedPages();
  const canRestore = auth.isPrimary || auth.isSeAdmin;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <Card depth={1} className="p-6">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Trash2 className="h-6 w-6 text-primary" />
              <CardTitle>Trash</CardTitle>
            </div>
            <Link href="/dashboard/pages">
              <Button variant="neutral" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1.5" />
                Back to pages
              </Button>
            </Link>
          </div>
        </CardHeader>
        <p className="mb-4 text-sm text-muted-foreground">
          Archived pages are not served to the public. Their URLs return a “gone”
          notice. Primary officers can restore them back to draft.
        </p>
        <TrashListClient
          initialPages={pages.map((p) => ({
            ...p,
            archivedAt: p.archivedAt?.toISOString() ?? null,
            updatedAt: p.updatedAt.toISOString(),
          }))}
          canRestore={canRestore}
        />
      </Card>
    </div>
  );
}
