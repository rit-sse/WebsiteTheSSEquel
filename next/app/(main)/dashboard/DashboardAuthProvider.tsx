"use client";

import { createContext, useContext } from "react";

interface DashboardAuth {
  isOfficer: boolean;
  isMentor: boolean;
  isPrimary: boolean;
  isPresident: boolean;
  isMentoringHead: boolean;
}

const DashboardAuthContext = createContext<DashboardAuth>({
  isOfficer: false,
  isMentor: false,
  isPrimary: false,
  isPresident: false,
  isMentoringHead: false,
});

export function useDashboardAuth() {
  return useContext(DashboardAuthContext);
}

export function DashboardAuthProvider({
  children,
  isOfficer,
  isMentor,
  isPrimary,
  isPresident,
  isMentoringHead,
}: DashboardAuth & { children: React.ReactNode }) {
  return (
    <DashboardAuthContext.Provider
      value={{ isOfficer, isMentor, isPrimary, isPresident, isMentoringHead }}
    >
      {children}
    </DashboardAuthContext.Provider>
  );
}
