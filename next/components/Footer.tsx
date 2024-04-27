'use client'

import ExternalHyperlinkText from "./common/ExternalHyperlinkText";
import Link from "next/link";
import HomepageContent from "@/app/HomepageContent";
import { DiscordIcon, InstagramIcon, SlackIcon, TikTokIcon, TwitchIcon } from "./common/Icons";
import DarkModeToggle from "./common/DarkModeToggle";

const Footer: React.FC = () => {
    return (
        <footer className="flex items-center justify-between w-full h-auto p-3">
            <div className="flex items-center justify-start fixed left-3 bottom-3">
                <DarkModeToggle />
            </div>
            <div className="flex flex-row items-center justify-end gap-2 flex-grow">
                <Link href={HomepageContent.slackLink} className='group rounded-md' aria-label="Link to Slack" target='_blank' rel='noopener noreferrer'>
                    <SlackIcon className='w-8 h-8 fill-primary hover:fill-primary-focus group-focus:fill-primary-focus' />
                </Link>

                <Link href={HomepageContent.discordLink} className='group rounded-md' aria-label="Link to Discord" target='_blank' rel='noopener noreferrer'>
                    <DiscordIcon className='w-8 h-8 fill-primary hover:fill-primary-focus group-focus:fill-primary-focus' />
                </Link>

                <Link href={HomepageContent.instagramLink} className='group rounded-md' aria-label="Link to Instagram" target='_blank' rel='noopener noreferrer'>
                    <InstagramIcon className='w-8 h-8 fill-primary hover:fill-primary-focus group-focus:fill-primary-focus' />
                </Link>

                <Link href={HomepageContent.tiktokLink} className='group rounded-md' aria-label="Link to TikTok" target='_blank' rel='noopener noreferrer'>
                    <TikTokIcon className='w-8 h-8 fill-primary hover:fill-primary-focus group-focus:fill-primary-focus' />
                </Link>

                <Link href={HomepageContent.twitchLink} className='group rounded-md' aria-label="Link to Twitch" target='_blank' rel='noopener noreferrer'>
                    <TwitchIcon className='w-8 h-8 fill-primary hover:fill-primary-focus group-focus:fill-primary-focus' />
                </Link>
            </div>
        </footer>
    );
};


export default Footer;
