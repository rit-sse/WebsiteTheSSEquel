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
        description: "GitHub Projects board for Tech Committee projects and tasks"
    }
];

export default function GoLinks() {
    const goLinkList = goLinkData.map(data => (
        <GoLink
            key={data.shortlink}
            shortlink={data.shortlink}
            url={data.url}
            description={data.description}
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
