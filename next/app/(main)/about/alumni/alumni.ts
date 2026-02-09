export interface AlumniMember {
  alumni_id: string;
  name: string;
  email: string;
  linkedin?: string;
  github?: string;
  description?: string;
  image?: string;
  quote?: string;
  previous_roles?: string;
  start_date: string;
  end_date: string;
  showEmail?: boolean;
}

export interface Team {
  alumni_member: AlumniMember[];
}  