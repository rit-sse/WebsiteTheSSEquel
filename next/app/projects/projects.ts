import internal from "stream";

const placeholder_w = 400;
const placeholder_h = 240;
const defaultImage = `https://dummyimage.com/${placeholder_w}x${placeholder_h}`
// export interface Project{
//     id: number,
//     logo: string;
//     title: string;
//     lead: string;
//     contact: string;
//     description: string;
//     stack?: string;
//     progress: string;
//     repoLink: string;
//     completed: boolean;
//     leadid: number;
//     projectImage: string;
//     content
// }
export interface Project{
    id: number,
    title: string,
    description: string,
    leadid: number,
    progress: string,
    repoLink: string,
    contentURL: string,
    projectImage: string,
    completed: boolean
}

// export const projectsData: Project[] = [
//     {
//         logo: "/images/projects-5.jpg",
//         title: "Project 1",
//         lead: "lead 1",
//         contact: "lead1@email.com",
//         description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia, aliquid. Laudantium veritatis veniam praesentium nesciunt facilis quod quam nihil labore perferendis, qui molestiae ad quibusdam magnam consequatur tempore, hic minus!",
//         stack: "Stack",
//         progress: "In Progress",
//         repoLink: "https://github.com/pybash/SSE-Display",
//         completed: false,
//     },
//     {
//         logo: "/images/projects-3.jpg",
//         title: "Project 2",
//         lead: "Lead 2",
//         contact: "lead2@email.com",
//         description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia, aliquid. Laudantium veritatis veniam praesentium nesciunt facilis quod quam nihil labore perferendis, qui molestiae ad quibusdam magnam consequatur tempore, hic minus!",
//         progress: "Conceptualization",
//         repoLink: "https://github.com/pybash/SSE-Display",
//         completed: false,
//     },
//     {
//         logo: "/images/projects-4.jpg",
//         title: "Project 3",
//         lead: "Lead 3",
//         contact: "lead3@email.com",
//         description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia, aliquid. Laudantium veritatis veniam praesentium nesciunt facilis quod quam nihil labore perferendis, qui molestiae ad quibusdam magnam consequatur tempore, hic minus!",
//         stack: "Stack",
//         progress: "Complete",
//         repoLink: "https://github.com/pybash/SSE-Display",
//         completed: true,
//     },
//     {
//         logo: "",
//         title: "empty project",
//         lead: "Lead 4",
//         contact: "lead4@email.com",
//         description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia, aliquid. Laudantium veritatis veniam praesentium nesciunt facilis quod quam nihil labore perferendis, qui molestiae ad quibusdam magnam consequatur tempore, hic minus!",
//         stack: "Stack",
//         progress: "Complete",
//         repoLink: "https://github.com/pybash/SSE-Display",
//         completed: true,
//     },{
//         logo: "",
//         title: "empty project",
//         lead: "Lead 4",
//         contact: "lead4@email.com",
//         description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia, aliquid. Laudantium veritatis veniam praesentium nesciunt facilis quod quam nihil labore perferendis, qui molestiae ad quibusdam magnam consequatur tempore, hic minus!",
//         stack: "Stack",
//         progress: "Complete",
//         repoLink: "https://github.com/pybash/SSE-Display",
//         completed: true,
//     },{
//         logo: "",
//         title: "empty project",
//         lead: "Lead 4",
//         contact: "lead4@email.com",
//         description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia, aliquid. Laudantium veritatis veniam praesentium nesciunt facilis quod quam nihil labore perferendis, qui molestiae ad quibusdam magnam consequatur tempore, hic minus!",
//         stack: "Stack",
//         progress: "Complete",
//         repoLink: "https://github.com/pybash/SSE-Display",
//         completed: true,
//     },{
//         logo: "",
//         title: "empty project",
//         lead: "Lead 4",
//         contact: "lead4@email.com",
//         description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia, aliquid. Laudantium veritatis veniam praesentium nesciunt facilis quod quam nihil labore perferendis, qui molestiae ad quibusdam magnam consequatur tempore, hic minus!",
//         stack: "Stack",
//         progress: "Complete",
//         repoLink: "https://github.com/pybash/SSE-Display",
//         completed: true,
//     },{
//         logo: "",
//         title: "empty project",
//         lead: "Lead 4",
//         contact: "lead4@email.com",
//         description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia, aliquid. Laudantium veritatis veniam praesentium nesciunt facilis quod quam nihil labore perferendis, qui molestiae ad quibusdam magnam consequatur tempore, hic minus!",
//         stack: "Stack",
//         progress: "Complete",
//         repoLink: "https://github.com/pybash/SSE-Display",
//         completed: true,
//     },{
//         logo: "",
//         title: "empty project",
//         lead: "Lead 4",
//         contact: "lead4@email.com",
//         description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia, aliquid. Laudantium veritatis veniam praesentium nesciunt facilis quod quam nihil labore perferendis, qui molestiae ad quibusdam magnam consequatur tempore, hic minus!",
//         stack: "Stack",
//         progress: "Complete",
//         repoLink: "https://github.com/pybash/SSE-Display",
//         completed: true,
//     },{
//         logo: "",
//         title: "empty project",
//         lead: "Lead 4",
//         contact: "lead4@email.com",
//         description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia, aliquid. Laudantium veritatis veniam praesentium nesciunt facilis quod quam nihil labore perferendis, qui molestiae ad quibusdam magnam consequatur tempore, hic minus!",
//         stack: "Stack",
//         progress: "Complete",
//         repoLink: "https://github.com/pybash/SSE-Display",
//         completed: true,
//     },
// ] 