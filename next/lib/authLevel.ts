export type AuthLevel = {
  userId: number | null;
  isUser: boolean;
  isMember: boolean;
  membershipCount: number;
  isMentor: boolean;
  isOfficer: boolean;
  isMentoringHead: boolean;
  isProjectsHead: boolean;
  isTechCommitteeHead: boolean;
  isTechCommitteeDivisionManager: boolean;
  techCommitteeManagedDivision: string | null;
  isPrimary: boolean;
  /**
   * True for active primary officers, or for a staging-proxy user in the
   * testing environment so election flows can be exercised safely.
   */
  isPrimaryOfficer: boolean;
  isSeAdmin: boolean;
  profileComplete?: boolean;
};
