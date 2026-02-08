export interface LeaderboardItem {
    rank: number;
    userId: number;
    name: string;
    image?: string | null;
    membershipCount: number;
    lastMembershipAt: Date;
};

export interface AutocompleteOption {
    id: number
    name: string
    email: string
}

export interface Membership {
    userId: number;
    reason: string;
    dateGiven: string;
}