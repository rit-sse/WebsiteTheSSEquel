import GoLink from ".././GoLink";

const goLinkData: { shortlink: string; url: string; description: string }[] = [
    {
        shortlink: "scoreboard",
        url: "https://sse.rit.edu/go/scoreboard",
        description: "The new membership scoreboard created with google sheets!",
    },
    {
        shortlink: "movienight",
        url: "https://sse.rit.edu/go/movienight",
        description: "Movie Night",
    },
    {
        shortlink: "challenges-leaderboard",
        url: "https://sse.rit.edu/go/challenges-leaderboard",
        description: "The leaderboard for the weekly coding challenges",
    },
    {
        shortlink: "techprojects",
        url: "https://sse.rit.edu/go/techprojects",
        description: "GitHub Projects board for Tech Committee projects and tasks",
    },
    {
        shortlink: "projects",
        url: "https://sse.rit.edu/go/projects",
        description: "If you're interested in starting or working on a project, fill this out!",
    },
    {
        shortlink: "outreach_committe",
        url: "https://sse.rit.edu/go/outreach_committe",
        description: "Sign up form for Outreach Committte",
    },
    {
        shortlink: "talksideas",
        url: "https://sse.rit.edu/go/talksideas",
        description: "Document of all ideas for a talk",
    },
    {
        shortlink: "talksideasform",
        url: "https://sse.rit.edu/go/talksideasform",
        description: "Form to give an idea for a talk",
    },
    {
        shortlink: "microtalksrequest",
        url: "https://sse.rit.edu/go/microtalksrequest",
        description: "Form for requesting to do a micro talk",
    }
];

export default function GoLinks() {
    const goLinkList = goLinkData.map((data, index) => (
        <GoLink
            key={index}
            {...data}
        />
    ));

    return <div className="
        grid
        grid-cols-1
        sm:grid-cols-2
        md:grid-cols-3
        lg:grid-cols-4
        gap-4
        p-4
    ">
        {goLinkList}
    </div>;
}
