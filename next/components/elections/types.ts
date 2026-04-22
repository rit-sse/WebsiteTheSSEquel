import type {
  ElectionStatus,
  ElectionNominationStatus,
  ElectionEligibilityStatus,
  ElectionApprovalStage,
  ElectionEmailKind,
} from "@prisma/client";

// Re-export enums for convenience
export type {
  ElectionStatus,
  ElectionNominationStatus,
  ElectionEligibilityStatus,
  ElectionApprovalStage,
  ElectionEmailKind,
};

/* ---------- Lightweight user reference ---------- */
export interface UserRef {
  id: number;
  name: string;
  email: string;
  /** Resolved profile image URL (from S3 or Google OAuth) */
  image?: string | null;
}

/* ---------- Officer position ---------- */
export interface OfficerPositionRef {
  id: number;
  title: string;
  is_primary: boolean;
  email: string;
}

/* ---------- Running mate (Amendment 12) ---------- */
export type RunningMateInviteStatus =
  | "INVITED"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "WITHDRAWN";

export interface SerializedRunningMateInvitation {
  id: number;
  presidentNominationId: number;
  inviteeUserId: number;
  status: RunningMateInviteStatus;
  expiresAt: string;
  respondedAt: string | null;
  declineReason: string | null;
  /** VP candidate-profile fields. Mirror `SerializedNomination`. Empty
   *  string / null until the VP fills them in on the accept page. */
  statement: string;
  yearLevel: number | null;
  program: string | null;
  canRemainEnrolledFullYear: boolean | null;
  canRemainEnrolledNextTerm: boolean | null;
  isOnCampus: boolean | null;
  isOnCoop: boolean | null;
  createdAt: string;
  updatedAt: string;
  invitee: UserRef;
}

/* ---------- Nomination ---------- */
export interface SerializedNomination {
  id: number;
  electionOfficeId: number;
  nomineeUserId: number;
  nominatorUserId: number;
  statement: string;
  yearLevel: number | null;
  program: string | null;
  canRemainEnrolledFullYear: boolean | null;
  canRemainEnrolledNextTerm: boolean | null;
  isOnCampus: boolean | null;
  isOnCoop: boolean | null;
  status: ElectionNominationStatus;
  eligibilityStatus: ElectionEligibilityStatus;
  reviewNotes: string | null;
  reviewedById: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  nominee: UserRef;
  nominator: UserRef;
  reviewedBy: UserRef | null;
  /** Present only on the President office's nominations (Amendment 12). */
  runningMateInvitation?: SerializedRunningMateInvitation | null;
}

/* ---------- Election office ---------- */
export interface SerializedElectionOffice {
  id: number;
  electionId: number;
  officerPositionId: number;
  officerPosition: OfficerPositionRef;
  nominations: SerializedNomination[];
}

/* ---------- Approval ---------- */
export interface SerializedApproval {
  id: number;
  electionId: number;
  userId: number;
  stage: ElectionApprovalStage;
  createdAt: string;
  user: UserRef;
}

/* ---------- Ballot ---------- */
export interface SerializedBallotRanking {
  id: number;
  ballotId: number;
  electionOfficeId: number;
  nominationId: number;
  rank: number;
  nomination?: {
    id: number;
    nominee: UserRef;
  };
}

export interface SerializedBallot {
  id: number;
  electionId: number;
  voterId: number;
  submittedAt: string;
  updatedAt: string;
  voter: UserRef;
  rankings: SerializedBallotRanking[];
}

/* ---------- Email log ---------- */
export interface SerializedEmailLog {
  id: number;
  electionId: number;
  sentById: number;
  kind: ElectionEmailKind;
  subject: string;
  message: string;
  recipientCount: number;
  sentAt: string;
  sentBy: UserRef;
}

/* ---------- Full election ---------- */
export interface SerializedElection {
  id: number;
  title: string;
  slug: string;
  description: string;
  status: ElectionStatus;
  nominationsOpenAt: string;
  nominationsCloseAt: string;
  votingOpenAt: string;
  votingCloseAt: string;
  createdById: number;
  certifiedById: number | null;
  certifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: UserRef;
  certifiedBy: UserRef | null;
  offices: SerializedElectionOffice[];
  approvals: SerializedApproval[];
  ballots: SerializedBallot[];
  emailLogs: SerializedEmailLog[];
}

/* ---------- Election list item (lightweight) ---------- */
export interface ElectionListItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  status: ElectionStatus;
  nominationsOpenAt: string;
  nominationsCloseAt: string;
  votingOpenAt: string;
  votingCloseAt: string;
  createdAt: string;
  offices: {
    id: number;
    officerPosition: { id: number; title: string; is_primary: boolean };
    nominations: {
      id: number;
      status: ElectionNominationStatus;
      eligibilityStatus: ElectionEligibilityStatus;
    }[];
  }[];
  /** Included when fetched for admin dashboard */
  approvals?: { id: number; stage: string; userId: number }[];
  /** Included when fetched for admin dashboard */
  ballots?: { id: number }[];
}

/* ---------- IRV results ---------- */
export interface IRVRoundCount {
  nominationId: number;
  candidateName: string;
  votes: number;
  eliminated: boolean;
}

export interface IRVRound {
  roundNumber: number;
  counts: IRVRoundCount[];
  eliminatedNominationId: number | null;
}

export interface IRVWinner {
  nominationId: number;
  /** User id of the winning nominee — used as a stable seed for the
   * deterministic gradient avatar when no real image is available. */
  userId: number;
  name: string;
  /** Resolved profile image URL (S3 proxy or Google OAuth avatar), or
   * `null` when the winner has neither uploaded nor authed one. */
  image: string | null;
  finalVotes: number;
}

export interface IRVRunningMate {
  userId: number;
  name: string;
  image: string | null;
}

export interface IRVOfficeResult {
  officeId: number;
  officeTitle: string;
  status: "ok" | "tie" | "no_candidates";
  winner: IRVWinner | null;
  runnerUp: IRVWinner | null;
  rounds: IRVRound[];
  totalBallots: number;
  /** Amendment 12: true when this office's winner was derived from another
   *  office's winning ticket (e.g. VP from the President's running mate). */
  ticketDerived?: boolean;
  /** Amendment 12: the running-mate VP attached to the President winner. */
  runningMate?: IRVRunningMate | null;
}

/* ---------- Election phase order ---------- */
export const ELECTION_PHASE_ORDER: ElectionStatus[] = [
  "DRAFT",
  "NOMINATIONS_OPEN",
  "NOMINATIONS_CLOSED",
  "VOTING_OPEN",
  "VOTING_CLOSED",
  "CERTIFIED",
];

export const ELECTION_PHASE_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  NOMINATIONS_OPEN: "Nominations Open",
  NOMINATIONS_CLOSED: "Nominations Closed",
  VOTING_OPEN: "Voting Open",
  VOTING_CLOSED: "Voting Closed",
  CERTIFIED: "Certified",
  CANCELLED: "Cancelled",
  TIE_RUNOFF_REQUIRED: "Runoff Needed",
};
