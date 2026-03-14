import { Card, CardContent } from "@/components/ui/card";
import TechCommitteeApplicationsGrid from "./TechCommitteeApplicationsGrid";

export default function TechCommitteeDashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <Card depth={1}>
        <CardContent className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Tech Committee Applications
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review current applicants and manage application availability.
            </p>
          </div>

          <TechCommitteeApplicationsGrid />
        </CardContent>
      </Card>
    </div>
  );
}
