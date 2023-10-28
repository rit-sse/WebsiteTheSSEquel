import GoLink from "./GoLink";

const goLinkData: { shortlink: string; url: string; description: string }[] = [
  {
    shortlink: "scoreboard",
    url: "https://sse.rit.edu/go/scoreboard",
    description: "The new membership scoreboard created with google sheets!",
  }
];

export default function GoLinks() {
  const goLinkList = goLinkData.map(data => (
    <GoLink
      shortlink={data.shortlink}
      url={data.url}
      description={data.description}
    />
  ));

  return <div>{goLinkList}</div>;
}
