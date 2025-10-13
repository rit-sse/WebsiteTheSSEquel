export interface AlumniMember {
  alumni_id: string;
  user_id: string;
  name: string;
  image: string;
  title: string;
  quote?: string;
  previous_roles?: string;
  desc?: string;
  linkedin?: string;
  github?: string;
  email: string;
  start_date: string;
  end_date: string;
}

export interface Team {
  alumni_member: AlumniMember[];
}  