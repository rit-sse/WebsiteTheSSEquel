import { SocialLinks } from "@/components/common/personcard/persondata";

export interface AlumniMember {
  alumni_id: string;
  name: string;
  email: string;
  socials?: SocialLinks;
  image?: string;
  quote?: string;
  previous_roles?: string;
  start_date: string;
  end_date: string;
}

export interface Team {
  alumni_member: AlumniMember[];
}  