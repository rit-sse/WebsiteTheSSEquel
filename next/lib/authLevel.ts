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
   * True iff the user actually holds an active officer row with a
   * `is_primary` position in the DB. Unlike `isPrimary`, this is NEVER
   * elevated by `STAGING_PROXY_AUTH`, so it can be used to gate UI that
   * must reflect real-world role assignments even on staging.
   */
  isPrimaryOfficer: boolean;
  isSeAdmin: boolean;
  profileComplete?: boolean;
};
