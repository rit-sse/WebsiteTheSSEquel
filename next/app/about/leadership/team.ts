import { SocialLinks } from "@/components/common/personcard/persondata";

export interface TeamMember {
  officer_id: string,
  user_id: string;
  name: string;
  image: string;
  title: string;
  desc?: string;
  socials: SocialLinks;
}

export interface Team {
  primary_officers: TeamMember[];
  committee_heads: TeamMember[];
}
