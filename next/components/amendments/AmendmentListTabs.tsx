"use client";

import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, LayoutDashboard, User } from "lucide-react";
import AmendmentCard from "@/components/amendments/AmendmentCard";
import AmendmentStatusFilterBar from "@/components/amendments/AmendmentStatusFilterBar";
import AmendmentDashboardStats from "@/components/amendments/AmendmentDashboardStats";
import AmendmentMyActivity from "@/components/amendments/AmendmentMyActivity";
import AmendmentEmptyState from "@/components/amendments/AmendmentEmptyState";
import type { AmendmentStatus } from "@prisma/client";

type AmendmentRow = {
  id: number;
  title: string;
  description: string;
  status: AmendmentStatus;
  totalVotes: number;
  approveVotes: number;
  rejectVotes: number;
  author?: { id: number; name: string | null };
};

type AuthInfo = {
  userId: number | null;
  isPrimary: boolean;
  isSeAdmin: boolean;
  isOfficer: boolean;
  isMember: boolean;
  isUser: boolean;
};

type AmendmentListTabsProps = {
  amendments: AmendmentRow[];
  auth: AuthInfo;
  statusFilter: string | null;
  userVotes: Record<number, boolean>;
};

function getRoleName(auth: AuthInfo): string {
  if (auth.isSeAdmin) return "SE Admin";
  if (auth.isPrimary) return "Primary Officer";
  if (auth.isOfficer) return "Officer";
  if (auth.isMember) return "Member";
  return "Visitor";
}

function getEmptyRole(auth: AuthInfo) {
  if (auth.isSeAdmin) return "seAdmin" as const;
  if (auth.isPrimary) return "primary" as const;
  if (auth.isOfficer) return "officer" as const;
  if (auth.isMember) return "member" as const;
  if (auth.isUser) return "signedIn" as const;
  return "anonymous" as const;
}

export default function AmendmentListTabs({
  amendments,
  auth,
  statusFilter,
  userVotes,
}: AmendmentListTabsProps) {
  const showDashboard = auth.isPrimary || auth.isSeAdmin;
  const showMyActivity = auth.isMember;
  const emptyRole = getEmptyRole(auth);
  const roleName = getRoleName(auth);

  const filterLabel = statusFilter
    ? { OPEN: "Open Forum", PRIMARY_REVIEW: "Primary Review", VOTING: "Voting", APPROVED: "Approved", REJECTED: "Rejected", MERGED: "Merged" }[statusFilter] ?? statusFilter
    : null;

  return (
    <Tabs defaultValue="all" className="space-y-5">
      <TabsList className="w-full max-w-lg">
        <TabsTrigger value="all" className="flex items-center gap-2 flex-1">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">All Amendments</span>
          <span className="sm:hidden">All</span>
        </TabsTrigger>
        {showDashboard && (
          <TabsTrigger value="dashboard" className="flex items-center gap-2 flex-1">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Dash</span>
          </TabsTrigger>
        )}
        {showMyActivity && (
          <TabsTrigger value="activity" className="flex items-center gap-2 flex-1">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">My Activity</span>
            <span className="sm:hidden">Mine</span>
          </TabsTrigger>
        )}
      </TabsList>

      {/* All Amendments Tab */}
      <TabsContent value="all" className="space-y-4">
        {/* Non-member banner */}
        {auth.isUser && !auth.isMember && (
          <div className="rounded-lg bg-amber-500/8 border border-amber-500/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            You&apos;re signed in but not yet a member. Members can propose amendments, vote, and join the discussion.
          </div>
        )}

        <Suspense>
          <AmendmentStatusFilterBar />
        </Suspense>

        {amendments.length === 0 ? (
          <AmendmentEmptyState role={emptyRole} filterLabel={filterLabel ?? undefined} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {amendments.map((amendment) => (
              <AmendmentCard
                key={amendment.id}
                amendment={amendment}
                userVote={userVotes[amendment.id] ?? null}
                isAuthor={amendment.author?.id === auth.userId}
              />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Dashboard Tab */}
      {showDashboard && (
        <TabsContent value="dashboard">
          <AmendmentDashboardStats
            amendments={amendments}
            roleName={roleName}
          />
        </TabsContent>
      )}

      {/* My Activity Tab */}
      {showMyActivity && (
        <TabsContent value="activity">
          <AmendmentMyActivity
            amendments={amendments}
            userId={auth.userId}
            userVotes={userVotes}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
