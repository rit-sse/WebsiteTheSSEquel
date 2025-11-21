import { Person } from "@/components/common/personcard/PersonCard";

export interface CommitteeMember {
    name: string;
    role: string;
    active_date: string;
    features?: string[];
}

export function toPerson(member: CommitteeMember): Person {
    return {name: member.name, title: member.role, end_date: member.active_date };
}