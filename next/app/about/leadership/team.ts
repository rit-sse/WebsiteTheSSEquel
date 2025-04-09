export interface TeamMember {
  officer_id: string,
  user_id: string;
  name: string;
  title: string;
  desc?: string;
  linkedin?: string;
  github?: string;
  email: string;
}

export interface Team {
  primary_officers: TeamMember[];
  committee_heads: TeamMember[];
}
