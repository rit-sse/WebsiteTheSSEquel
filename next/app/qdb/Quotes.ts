export interface Quote {
    id: number,
    quote: string,
    description: string,
    tags: string[],
}

export const Quotes: Quote[] = [
    {
        id: 1,
        quote: "[Gary] I'm in ya mother's DM's\n[Sylvia] So you're using an Ouija Board?",
        description: ":skull:",
        tags: ["Gary", "Sylvia"]
    },
    {
        id: 2,
        quote: "[Eric] I'm allergic to hoes, bros, and nonbinary foes",
        description: "Better being an Epi-Pen! Lab is full of 'em",
        tags: ["Eric"]
    },
]