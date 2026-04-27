export interface TeamMember {
  officer_id: string;
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
  /** PRIMARY_OFFICER (default) or SE_OFFICE (Admin Asst / Dean / SE
   *  Office Head / Undergraduate Dean). Used by the leadership page
   *  to split SE Office out of the Committee Heads bucket. */
  category?: "PRIMARY_OFFICER" | "SE_OFFICE";
}

export interface PositionWithOfficer {
  position: OfficerPosition;
  officer: TeamMember | null;
}

export interface Team {
  primary_officers: PositionWithOfficer[];
  se_office: PositionWithOfficer[];
  committee_heads: PositionWithOfficer[];
}
