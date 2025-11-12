export interface CommitteeMember {
    name: String;
    role: String;
    active_date: String;
    features?: String[];
}

export interface CommitteeMemberProp {
    member: CommitteeMember;
}