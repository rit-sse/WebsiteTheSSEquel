import { Event } from "./events/event";

const defaultDescription = `This is a description of the event. Lorem ipsum dolor sit amet,
                            consectetur adipiscing elit. Integer ullamcorper.`

interface HomepageContent {
    description: string;
    weeklyMeetingCallout: string;
    discordLink: string;
    instagramLink: string;
    tiktokLink: string;
    twitchLink: string;
}

export default {
    description: "An academic organization at the Rochester Institute of Technology providing mentoring and community to students in Golisano College.",
    weeklyMeetingCallout: "Come to our weekly meetings on Mondays at 1:00 PM in GOL-1670!",
    discordLink: "https://www.discord.gg/rNC6wj82kq",
    instagramLink: "https://www.instagram.com/rit_sse/",
    tiktokLink: "https://www.tiktok.com/@rit_sse",
    twitchLink: "https://www.twitch.tv/rit_sse",
} satisfies HomepageContent;

export const UpcomingEvents = [
    {
        title: "Spring Fling",
        date: "April 13th 5:00pm",
        location: "GOL-1400",
        image: "spring-fling-2.png",
        description: defaultDescription
    },
    {
        title: "SSE Mentoring Review Session",
        date: "April 22nd 6:00pm",
        location: "GOL-1670",
        image: "mentoring-review-session-1.png",
        description: defaultDescription
    },
    {
        title: "Micro Talks 2.0",
        date: "April 24th 4:00pm",
        location: "GOL-1670",
        image: "codfather.jpg",
        description: defaultDescription
    },
] satisfies Event[];