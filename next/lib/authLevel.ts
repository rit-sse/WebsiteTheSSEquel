export type AuthLevel = {
  userId: number | null;
  isUser: boolean;
  isMember: boolean;
  membershipCount: number;
  isMentor: boolean;
  isOfficer: boolean;
  isMentoringHead: boolean;
  isProjectsHead: boolean;
  isPrimary: boolean;
  profileComplete?: boolean;
};
