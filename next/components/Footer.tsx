'use client'

import Link from "next/link";
import HomepageContent from "@/app/HomepageContent";
import { DiscordIcon, GitHubIcon, InstagramIcon, LinkedInIcon, TwitchIcon } from "./common/Icons";
import ThemeControlsToggle from "./common/ThemeControlsToggle";

const commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH || "dev";

const Footer: React.FC = () => {
    return (
        <footer className="flex items-center w-full h-auto p-3">
            <div className="fixed left-3 bottom-3">
                <ThemeControlsToggle />
            </div>
            <div className="flex flex-row items-center gap-2 ml-auto">
                {commitHash !== "dev" ? (
                    <Link
                        href={`https://github.com/rit-sse/WebsiteTheSSEquel/commit/${commitHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-muted-foreground/60 hover:text-foreground transition-colors"
                        title={`Build: ${commitHash}`}
                    >
                        v{commitHash}
                    </Link>
                ) : (
                    <span className="text-xs font-mono text-muted-foreground/60" title={`Build: ${commitHash}`}>
                        v{commitHash}
                    </span>
                )}
                <Link href="/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Privacy
                </Link>
                <Link href="/about/credits" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    Credits
                </Link>
                <span className="text-muted-foreground/30 text-xs">|</span>
                <Link href={HomepageContent.discordLink} className='inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:text-foreground/80 transition-colors' aria-label="Link to Discord" target='_blank' rel='noopener noreferrer'>
                    <span className="h-5 w-5 overflow-hidden"><DiscordIcon className='h-full w-full' /></span>
                </Link>
                <Link href={HomepageContent.instagramLink} className='inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:text-foreground/80 transition-colors' aria-label="Link to Instagram" target='_blank' rel='noopener noreferrer'>
                    <span className="h-5 w-5 overflow-hidden"><InstagramIcon className='h-full w-full' /></span>
                </Link>
                <Link href="https://www.linkedin.com/company/society-of-software-engineers/" className='inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:text-foreground/80 transition-colors' aria-label="Link to LinkedIn" target='_blank' rel='noopener noreferrer'>
                    <span className="h-5 w-5 overflow-hidden"><LinkedInIcon className='h-full w-full' /></span>
                </Link>
                <Link href={HomepageContent.twitchLink} className='inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:text-foreground/80 transition-colors' aria-label="Link to Twitch" target='_blank' rel='noopener noreferrer'>
                    <span className="h-5 w-5 overflow-hidden"><TwitchIcon className='h-full w-full' /></span>
                </Link>
                <Link href="https://github.com/rit-sse" className='inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:text-foreground/80 transition-colors' aria-label="Link to GitHub" target='_blank' rel='noopener noreferrer'>
                    <span className="h-5 w-5 overflow-hidden"><GitHubIcon className='h-full w-full' /></span>
                </Link>
            </div>
        </footer>
    );
};


export default Footer;
