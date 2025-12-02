export interface Person {
    person_id?: string;
    name: string;
    image?: string;
    title?: string;
    description?: string;
    links?: SocialLinks;
    start_date?: string;
    end_date?: string;
    other_info?: string[];
}

export interface SocialLinks {
    email?: string;
    linkedin?: string;
    github?: string;
}