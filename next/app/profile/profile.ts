export enum Role {
    member = "Member",
    mentor = "Mentor",
    president = "President",
    vicePresident = "Vice President",
    treasurer = "Treasurer",
    secretary = "Secretary",
    techHead = "Tech Head",
    techApprentice = "Tech Apprentice",
    talksHead = "Talks Head",
    eventsHead = "Events Head",
    publicRelations = "Public Relations",
    mentoringHead = "Mentoring Head",
    marketing = "Marketing Head",
    studentOutreach = "Student Outreach"
}

export enum Link {
    email = "Email",
    website = "Personal Website",
    linkedIn = "LinkedIn",
    github = "GitHub",
    discord = "Discord",
    slack = "Slack",
    instagram = "Instagram",
    twitch = "Twitch"
}

export interface ProfileLinks {
    email?: string,
    website?: string,
    linkedIn?: string,
    github?: string,
    discord?: string,
    slack?: string,
    instagram?: string,
    twitch?: string
}

export interface Profile {
    avatar: string;
    name: string;
    // pronouns: string;
    role: Role;
    bio: string;
    links?: ProfileLinks;
}