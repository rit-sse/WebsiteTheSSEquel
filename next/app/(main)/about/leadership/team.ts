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

/** A historical officer record returned by /api/officer/history */
export interface HistoricalOfficer {
  id: number;
  start_date: string;
  end_date: string;
  user: {
    id: number;
    name: string;
    email: string;
    image: string | null;
    linkedIn?: string | null;
    gitHub?: string | null;
    description?: string | null;
  };
  position: {
    id: number;
    title: string;
    is_primary: boolean;
    is_defunct?: boolean;
  };
}

/** A single academic year bucket from the history endpoint */
export interface HistoricalYear {
  year: string;
  primary_officers: HistoricalOfficer[];
  committee_heads: HistoricalOfficer[];
}
