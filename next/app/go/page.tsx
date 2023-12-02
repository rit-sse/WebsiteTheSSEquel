import GoLinksContainer from "@/app/go/GoLinksContainer";
import PinnedGoLinksContainer from "@/app/go/PinnedGoLinksContainer";
import { GoLinkProps } from "./GoLink";
import SearchContainer from "./SearchContainer";

const goLinkData: { goUrl: string; url: string; description: string, pinned: boolean }[] = [
    {
        goUrl: "scoreboard",
        url: "https://sse.rit.edu/go/scoreboard",
        description: "The new membership scoreboard created with google sheets!",
        pinned: false,
    },
    {
        goUrl: "movienight",
        url: "https://sse.rit.edu/go/movienight",
        description: "Movie Night",
        pinned: false,
    },
    {
        goUrl: "challenges-leader",
        url: "https://sse.rit.edu/go/challenges-leaderboard",
        description: "The leaderboard for the leaderboard for the weeklyleaderboard for the weeklyleaderboard for the weekly weekly coding challenges",
        pinned: false,
    },
    {
        goUrl: "techprojects",
        url: "https://sse.rit.edu/go/techprojects",
        description: "GitHub Projects board for Tech Committee projects and tasks",
        pinned: false,
    },
    {
        goUrl: "projects",
        url: "https://sse.rit.edu/go/projects",
        description: "If you're interested in starting or working on a project, fill this out!",
        pinned: false,
    },
    {
        goUrl: "outreach_committe",
        url: "https://sse.rit.edu/go/outreach_committe",
        description: "Sign up form for Outreach Committte",
        pinned: false,
    },
    {
        goUrl: "talksideas",
        url: "https://sse.rit.edu/go/talksideas",
        description: "Document of all ideas for a talk",
        pinned: false,
    },
    {
        goUrl: "talksideasform",
        url: "https://sse.rit.edu/go/talksideasform",
        description: "Form to give an idea for a talk",
        pinned: false,
    },
    {
        goUrl: "microtalksrequest",
        url: "https://sse.rit.edu/go/microtalksrequest",
        description: "Form for requesting to do a micro talk",
        pinned: false,
    },
    {
        goUrl: "talksideas",
        url: "https://sse.rit.edu/go/talksideas",
        description: "Document of all ideas for a talk",
        pinned: false,
    },
    {
        goUrl: "talksideasform",
        url: "https://sse.rit.edu/go/talksideasform",
        description: "Form to give an idea for a talk",
        pinned: false,
    },
    {
        goUrl: "microtalksrequest",
        url: "https://sse.rit.edu/go/microtalksrequest",
        description: "Form for requesting to do a micro talk",
        pinned: false,
    }
];

export interface GoLinksContainerProps {
    goLinkData: GoLinkProps[];
}

const GoLinksPage = () => {
    return (
        <>
            <PinnedGoLinksContainer />
            {/* <SearchContainer goLinkData={goLinkData}/> */}
            <GoLinksContainer goLinkData={goLinkData} />
        </>
    )
}

export default GoLinksPage;