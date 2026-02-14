"use client";

import { Linkedin } from "lucide-react";

interface LinkedInBadgeProps {
    /** LinkedIn vanity username (e.g. "jjalangtry") */
    username: string;
    /** Display name for the card */
    name?: string;
    /** Optional role/headline */
    headline?: string;
}

/**
 * A clean, custom LinkedIn profile card.
 * No external scripts — just links to their profile.
 * Styled to match GitHubProfileCard.
 */
export default function LinkedInBadge({
    username,
    name,
    headline,
}: LinkedInBadgeProps) {
    const profileUrl = `https://www.linkedin.com/in/${username}`;

    return (
        <div className="rounded-lg border border-border overflow-hidden">
            {/* Header with LinkedIn branding */}
            <div className="p-4 flex items-center gap-4">
                <a
                    href={profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 w-14 h-14 rounded-full bg-[#0A66C2] flex items-center justify-center"
                >
                    <Linkedin className="w-7 h-7 text-white" />
                </a>
                <div className="min-w-0 flex-1">
                    <a
                        href={profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-foreground hover:text-primary transition-colors block truncate"
                    >
                        {name || username}
                    </a>
                    <p className="text-sm text-muted-foreground truncate">
                        /{username}
                    </p>
                    {headline && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {headline}
                        </p>
                    )}
                </div>
            </div>

            {/* View profile link */}
            <div className="border-t border-border px-4 py-3">
                <a
                    href={profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm font-medium text-[#0A66C2] hover:underline"
                >
                    <Linkedin className="w-4 h-4" />
                    View LinkedIn Profile
                </a>
            </div>
        </div>
    );
}
