"use client"

import { createContext, useContext } from "react"

interface DashboardAuth {
  isOfficer: boolean
  isMentor: boolean
  isPrimary: boolean
  isMentoringHead: boolean
}

const DashboardAuthContext = createContext<DashboardAuth>({
  isOfficer: false,
  isMentor: false,
  isPrimary: false,
  isMentoringHead: false,
})

export function useDashboardAuth() {
  return useContext(DashboardAuthContext)
}

export function DashboardAuthProvider({
  children,
  isOfficer,
  isMentor,
  isPrimary,
  isMentoringHead,
}: DashboardAuth & { children: React.ReactNode }) {
  return (
    <DashboardAuthContext.Provider
      value={{ isOfficer, isMentor, isPrimary, isMentoringHead }}
    >
      {children}
    </DashboardAuthContext.Provider>
  )
}
