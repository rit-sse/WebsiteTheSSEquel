"use client";

import { createContext, useContext } from "react";

interface DashboardAuth {
  isOfficer: boolean;
  isMentor: boolean;
  isPrimary: boolean;
  isMentoringHead: boolean;
  isSeAdmin: boolean;
  isTechCommitteeHead: boolean;
  isTechCommitteeDivisionManager: boolean;
}

const DashboardAuthContext = createContext<DashboardAuth>({
  isOfficer: false,
  isMentor: false,
  isPrimary: false,
  isMentoringHead: false,
  isSeAdmin: false,
  isTechCommitteeHead: false,
  isTechCommitteeDivisionManager: false,
});

export function useDashboardAuth() {
  return useContext(DashboardAuthContext);
}

export function DashboardAuthProvider({
  children,
  isOfficer,
  isMentor,
  isPrimary,
  isMentoringHead,
  isSeAdmin,
  isTechCommitteeHead,
  isTechCommitteeDivisionManager,
}: DashboardAuth & { children: React.ReactNode }) {
  return (
    <DashboardAuthContext.Provider
      value={{
        isOfficer,
        isMentor,
        isPrimary,
        isMentoringHead,
        isSeAdmin,
        isTechCommitteeHead,
        isTechCommitteeDivisionManager,
      }}
    >
      {children}
    </DashboardAuthContext.Provider>
  );
}
