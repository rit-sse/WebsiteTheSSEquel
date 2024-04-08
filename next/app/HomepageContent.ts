import { Event } from "./events/event";

const placeholder_w = 540;
const placeholder_h = 400;
const defaultImage = `https://dummyimage.com/${placeholder_w}x${placeholder_h}`
const defaultDescription = `This is a description of the event. Lorem ipsum dolor sit amet,
                            consectetur adipiscing elit. Integer ullamcorper dui eu ex laoreet,
                            sagittis aliquet mauris ornare. Nullam urna magna, hendrerit nec tortor
                            porttitor, dignissim vulputate neque. Etiam accumsan ut leo sit amet lacinia.
                            Nam euismod risus nec nunc commodo, quis laoreet ligula mollis.
                            Mauris sodales ac neque quis blandit. Aenean vel lobortis eros.`

interface HomepageContent {
    description: string;
    weeklyMeetingCallout: string;
    slackLink: string;
    discordLink: string;
    instagramLink: string;
    tiktokLink: string;
    twitchLink: string;
}

export default {
    description: "An academic organization at the Rochester Institute of Technology providing mentoring and community to students in Golisano College.",
    weeklyMeetingCallout: "Come to our weekly meetings on Mondays at 1:00 PM in GOL-1670!",
    slackLink: "https://rit-sse.slack.com/",
    discordLink: "#",
    instagramLink: "https://www.instagram.com/rit_sse/",
    tiktokLink: "https://www.tiktok.com/@rit_sse",
    twitchLink: "https://www.twitch.tv/rit_sse",
} satisfies HomepageContent;

export const upcomingEvents = [
    {
        title: "SSE Open House",
        date: "April 13, 2024",
        location: "GOL-1400",
        imageSrc: defaultImage,
        description: defaultDescription
    },
    {
        title: "PowerPoint Karaoke",
        date: "April 22, 2024",
        location: "GOL-1670",
        imageSrc: defaultImage,
        description: defaultDescription
    },
    {
        title: "Micro Talks 2.0",
        date: "April 24, 2024",
        location: "GOL-1670",
        imageSrc: defaultImage,
        description: defaultDescription
    },
] satisfies Event[];