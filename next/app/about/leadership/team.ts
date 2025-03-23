export interface TeamMember {
  name: string;
  title: string;
  email?: string;
}

export interface Team {
  primary_officers: TeamMember[];
  committee_heads: TeamMember[];
}
