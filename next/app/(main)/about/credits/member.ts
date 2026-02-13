/*export interface CommitteeMember {
    user_id: string; // For linking to profile page later
    name: string;
    role?: string;
    active_date: string;
    features?: string[];
}*/
export interface CommitteeMember {
    name: string;
    gitHub: string | null;
}

export interface CommitteeMemberProp {
    member: CommitteeMember;
}