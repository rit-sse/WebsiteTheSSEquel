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
  isSeAdmin: boolean;
  profileComplete?: boolean;
};
