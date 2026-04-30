import { redirect } from "next/navigation";
import { getAuthLevel } from "@/lib/services/authLevelService";
import { listPhotoCategoriesWithCounts } from "@/lib/services/photoCategoryService";
import { CategoriesClient } from "./CategoriesClient";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const auth = await getAuthLevel();
  if (!auth.isOfficer && !auth.isSeAdmin) redirect("/");
  const categories = await listPhotoCategoriesWithCounts();
  return (
    <CategoriesClient
      initialCategories={categories}
      canDelete={auth.isPrimary || auth.isSeAdmin}
    />
  );
}
