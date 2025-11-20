import { CommitteeMember } from "./member";

export const contributors: CommitteeMember[] = [
    {
        user_id: "Ue33hf893rh0", 
        name: "Name Lastname", 
        role: "Role", 
        active_date: "Spring 2025", 
        features: ["One page", "2 page", "red page"]
    },
    {
        user_id: "676767676767", 
        name: "Another Name", 
        role: "Another Role", 
        active_date: "Fall 2023", 
        features: ["blue page"]
    },
    {
        user_id: "hFIUh8fe3uhF", 
        name: "Last Name", 
        role: "A very long role name", 
        active_date: "Summer 1009"
    }
].sort((m1, m2) => m1.name.localeCompare(m2.name));