import { Skeleton } from "@/components/ui/skeleton";
import { NeoCard } from "@/components/ui/neo-card";
import { Card } from "@/components/ui/card";

export default function AmendmentDetailSkeleton() {
  return (
    <section className="w-full max-w-6xl space-y-5">
      {/* Header card skeleton */}
      <NeoCard depth={1} className="p-5 md:p-7 space-y-4">
        <div className="flex flex-wrap gap-3 justify-between items-start">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-3/4 max-w-md" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full max-w-lg" />
        <div className="flex gap-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-28" />
        </div>
      </NeoCard>

      {/* Content grid skeleton */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Diff viewer skeleton */}
        <Card depth={2} className="lg:col-span-3 p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </Card>

        {/* Sidebar skeleton */}
        <div className="lg:col-span-2 space-y-5">
          <Card depth={2} className="p-5 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-[180px] w-[180px] rounded-full mx-auto" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </Card>
          <Card depth={2} className="p-4 space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-20 w-full" />
          </Card>
        </div>
      </div>
    </section>
  );
}
