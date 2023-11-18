import GoLink from ".././GoLink";

const goLinkData: { goUrl: string; url: string; description: string }[] = [
    {
        goUrl: "scoreboard",
        url: "https://sse.rit.edu/go/scoreboard",
        description: "The new membership scoreboard created with google sheets!",
    },
    {
        goUrl: "movienight",
        url: "https://sse.rit.edu/go/movienight",
        description: "Movie Night",
    },
    {
        goUrl: "challenges-leaderboardtesiuyriuweyrpqwoerywqeopryweroywruywqerpuyqewirqypoy",
        url: "https://sse.rit.edu/go/challenges-leaderboard",
        description: "The leaderboard for the leaderboard for the weeklyleaderboard for the weeklyleaderboard for the weekly weekly coding challenges",
    },
    {
        goUrl: "techprojects",
        url: "https://sse.rit.edu/go/techprojects",
        description: "GitHub Projects board for Tech Committee projects and tasks",
    },
    {
        goUrl: "projects",
        url: "https://sse.rit.edu/go/projects",
        description: "If you're interested in starting or working on a project, fill this out!",
    },
    {
        goUrl: "outreach_committe",
        url: "https://sse.rit.edu/go/outreach_committe",
        description: "Sign up form for Outreach Committte",
    },
    {
        goUrl: "talksideas",
        url: "https://sse.rit.edu/go/talksideas",
        description: "Document of all ideas for a talk",
    },
    {
        goUrl: "talksideasform",
        url: "https://sse.rit.edu/go/talksideasform",
        description: "Form to give an idea for a talk",
    },
    {
        goUrl: "microtalksrequest",
        url: "https://sse.rit.edu/go/microtalksrequest",
        description: "Form for requesting to do a micro talk",
    }
];

export default function GoLinks() {
    const goLinkList = goLinkData.map((data, index) => (
        <GoLink
            key={index}
            {...data}
            canEdit={false}
        />
    ));

    return (
        <div>
            <h1>Go Links</h1>
            
            <div className="
                grid
                grid-cols-1
                sm:grid-cols-1
                md:grid-cols-2
                lg:grid-cols-2
                gap-4
                p-4
            ">
                {goLinkList}
            </div>
        </div>
    );
}
