// import GoLink from ".././GoLink";

import PinnedGoLink from "../pinnedGoLink";

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
        goUrl: "challenges-leaderboard",
        url: "https://sse.rit.edu/go/challenges-leaderboard",
        description: "The leaderboard for the leaderboard for the weekly coding challenges",
    },
];

export default function PinnedGoLinks() {
    let pinnedList = goLinkData.map((data, index) => (
        <PinnedGoLink
        key = {index}
        {...data}
        />
    ));
    return(
            <div className ="
            grid
            grid-cols-3
            gap-4
            p-4">
                {pinnedList}
            </div>
    )
}
