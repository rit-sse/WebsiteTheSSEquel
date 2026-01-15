export interface TeamMember {
  officer_id: string,
  user_id: string;
  name: string;
  image: string;
  title: string;
  desc?: string;
  linkedin?: string;
  github?: string;
  email: string;
}

export interface OfficerPosition {
  id: number;
  title: string;
  is_primary: boolean;
  email: string;
}

export interface PositionWithOfficer {
  position: OfficerPosition;
  officer: TeamMember | null;
}

export interface Team {
  primary_officers: PositionWithOfficer[];
  committee_heads: PositionWithOfficer[];
}
