export interface CommitteeHeadPositionOption {
  id: number;
  title: string;
  email: string;
}

export interface CommitteeHeadNominationCycleSummary {
  id: number;
  name: string;
  term: string;
  year: number;
}

export interface CommitteeHeadNominateData {
  cycle: CommitteeHeadNominationCycleSummary | null;
  positions: CommitteeHeadPositionOption[];
  viewer: {
    id: number;
    name: string;
    email: string;
    major: string | null;
  } | null;
  isPrimary: boolean;
}
