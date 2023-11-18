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