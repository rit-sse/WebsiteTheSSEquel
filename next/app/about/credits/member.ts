import { Person } from "@/components/common/personcard/persondata";
import { features } from "process";

export interface CommitteeMember {
    name: string;
    role: string;
    active_date: string;
    features?: string[];
}

export function toPerson(member: CommitteeMember): Person {
    return { 
        name: member.name, 
        title: member.role, 
        end_date: member.active_date, 
        other_info: member.features?.slice(0,2) 
    };
}