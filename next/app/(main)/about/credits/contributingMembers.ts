import { CommitteeMember } from "./member";

export const contributors: CommitteeMember[] = [
    {
        user_id: "todo when userprofile made", 
        name: "Owen Hickman",
        //role: "if it exists", //optional
        active_date: "Fall 2025", 
        features: [ "Credits page" ] // optional
    }
].sort((m1, m2) => m1.name.localeCompare(m2.name));