export interface Project{
    logo: string;
    title: string;
    supervisor: string;
    contact: string;
    description: string;
    stack: string;
}

export const projectsData: Project[] = [
    {
        logo: "💼",
        title: "Project 1",
        supervisor: "Supervisor 1",
        contact: "supervisor1@email.com",
        description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia, aliquid. Laudantium veritatis veniam praesentium nesciunt facilis quod quam nihil labore perferendis, qui molestiae ad quibusdam magnam consequatur tempore, hic minus!",
        stack: "Stack"
    },
    {
        logo: "🦋",
        title: "Project 2",
        supervisor: "Supervisor 2",
        contact: "supervisor2@email.com",
        description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia, aliquid. Laudantium veritatis veniam praesentium nesciunt facilis quod quam nihil labore perferendis, qui molestiae ad quibusdam magnam consequatur tempore, hic minus!",
        stack: "Stack"
    },
    {
        logo: "🎱",
        title: "Project 3",
        supervisor: "Supervisor 3",
        contact: "supervisor3@email.com",
        description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia, aliquid. Laudantium veritatis veniam praesentium nesciunt facilis quod quam nihil labore perferendis, qui molestiae ad quibusdam magnam consequatur tempore, hic minus!",
        stack: "Stack"
    },
] 