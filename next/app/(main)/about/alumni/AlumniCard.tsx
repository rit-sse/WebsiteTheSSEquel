"use client";

import { useRef, useEffect, useState } from "react";
import { Github, Linkedin, Mail, X, Building2, MapPin, Briefcase, Globe, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AlumniMember } from "./alumni";
import Avatar from "boring-avatars";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useGitHubUser } from "@/hooks/use-github-user";
import UpdateAlumniForm from "./UpdateAlumniForm";

function ensureGithubUrl(val: string): string {
    if (val.startsWith("https://") || val.startsWith("http://")) return val;
    if (val.includes("github.com")) return `https://${val}`;
    return `https://github.com/${val}`;
}

function ensureLinkedinUrl(val: string): string {
    if (val.startsWith("https://") || val.startsWith("http://")) return val;
    if (val.includes("linkedin.com")) return `https://${val}`;
    return `https://linkedin.com/in/${val}`;
}

function extractGitHubUsername(val: string): string {
    if (!val) return "";
    try {
        const url = new URL(val.startsWith("http") ? val : `https://${val}`);
        const parts = url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
        return parts[0] || val;
    } catch {
        return val.replace(/^(https?:\/\/)?(www\.)?github\.com\//, "").replace(/\/$/, "");
    }
}

interface MiniRepo {
    name: string;
    html_url: string;
    stargazers_count: number;
    language: string | null;
    fork: boolean;
}

interface MiniOrg {
    login: string;
    avatar_url: string;
}

interface LangStat {
    name: string;
    count: number;
}

const LANG_COLORS: Record<string, string> = {
    JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
    Java: "#b07219", "C++": "#f34b7d", C: "#555555", "C#": "#178600",
    Go: "#00ADD8", Rust: "#dea584", Ruby: "#701516", PHP: "#4F5D95",
    Swift: "#F05138", Kotlin: "#A97BFF", Dart: "#00B4AB", HTML: "#e34c26",
    CSS: "#563d7c", Shell: "#89e051", Lua: "#000080", Scala: "#c22d40",
    R: "#198CE7", Haskell: "#5e5086", Elixir: "#6e4a7e", Zig: "#ec915c",
};
function getLangColor(lang: string): string { return LANG_COLORS[lang] || "#8b8b8b"; }

/** Compact inline GitHub preview — fits alongside the profile without adding height */
function GitHubMiniPreview({ username }: { username: string }) {
    const { user } = useGitHubUser(username);
    const [repos, setRepos] = useState<MiniRepo[]>([]);
    const [orgs, setOrgs] = useState<MiniOrg[]>([]);
    const [topLangs, setTopLangs] = useState<LangStat[]>([]);

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            fetch(`https://api.github.com/users/${username}/repos?per_page=50&sort=pushed`)
                .then((r) => (r.ok ? r.json() : [])),
            fetch(`https://api.github.com/users/${username}/orgs`)
                .then((r) => (r.ok ? r.json() : [])),
        ]).then(([repoData, orgData]: [MiniRepo[], MiniOrg[]]) => {
            if (cancelled) return;
            const own = repoData.filter((r) => !r.fork);
            setRepos(
                [...own].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 4)
            );
            const langCounts = new Map<string, number>();
            for (const r of own) {
                if (r.language) langCounts.set(r.language, (langCounts.get(r.language) || 0) + 1);
            }
            setTopLangs(
                Array.from(langCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([name, count]) => ({ name, count }))
            );
            setOrgs(orgData.slice(0, 4));
        }).catch(() => {});

        return () => { cancelled = true; };
    }, [username]);

    if (!user) return null;

    const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
    const totalLangRepos = topLangs.reduce((s, l) => s + l.count, 0);

    return (
        <div className="flex flex-col gap-2 text-left text-xs">
            {/* Bio */}
            {user.bio && (
                <p className="text-[11px] text-muted-foreground line-clamp-2">{user.bio}</p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                <span><strong className="text-foreground">{user.public_repos}</strong> repos</span>
                <span><strong className="text-foreground">{user.followers}</strong> followers</span>
                {totalStars > 0 && (
                    <span className="flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5" />
                        <strong className="text-foreground">{totalStars}</strong>
                    </span>
                )}
            </div>

            {/* Top Languages — colored bar + dot labels */}
            {topLangs.length > 0 && (
                <div>
                    <div className="flex h-1.5 rounded-full overflow-hidden mb-1.5">
                        {topLangs.map((l) => (
                            <div
                                key={l.name}
                                className="h-full"
                                style={{
                                    width: `${(l.count / totalLangRepos) * 100}%`,
                                    backgroundColor: getLangColor(l.name),
                                }}
                                title={`${l.name}: ${l.count} repos`}
                            />
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                        {topLangs.map((l) => (
                            <span key={l.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <span
                                    className="inline-block w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: getLangColor(l.name) }}
                                />
                                {l.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Top repos */}
            {repos.length > 0 && (
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Top repos
                    </p>
                    {repos.map((r) => (
                        <a
                            key={r.name}
                            href={r.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate"
                        >
                            {r.name}
                            {r.stargazers_count > 0 && (
                                <span className="flex items-center gap-0.5 text-muted-foreground text-[10px] shrink-0">
                                    <Star className="h-2.5 w-2.5" />{r.stargazers_count}
                                </span>
                            )}
                            {r.language && (
                                <span className="text-[10px] text-muted-foreground shrink-0">{r.language}</span>
                            )}
                        </a>
                    ))}
                </div>
            )}

            {/* Organizations */}
            {orgs.length > 0 && (
                <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Organizations
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {orgs.map((org) => (
                            <a
                                key={org.login}
                                href={`https://github.com/${org.login}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/50 hover:bg-muted transition-colors"
                                title={org.login}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={org.avatar_url} alt={org.login} className="w-3.5 h-3.5 rounded-sm" />
                                <span className="text-[11px] text-foreground">{org.login}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

interface AlumniCardProps {
    alumniMember: AlumniMember;
    children?: React.ReactNode;
    onClick?: () => void;
    isExpanded?: boolean;
    onClose?: () => void;
}

export default function AlumniCard({
    alumniMember,
    children,
    onClick,
    isExpanded,
    onClose,
}: AlumniCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    const githubUsername = alumniMember.github
        ? extractGitHubUsername(alumniMember.github)
        : null;
    const hasWidgets = !!githubUsername;

    // Track whether the sidebar is still in the DOM (including during exit animation).
    // This prevents the inner flex direction from flipping to column while the sidebar
    // is still animating out, which would cause it to briefly wrap below the card.
    const [sidebarPresent, setSidebarPresent] = useState(false);

    useEffect(() => {
        if (isExpanded && hasWidgets) {
            setSidebarPresent(true);
        }
    }, [isExpanded, hasWidgets]);

    // Use row layout as long as the sidebar is present (expanded or exiting)
    const useRowLayout = (isExpanded && hasWidgets) || sidebarPresent;

    // Fetch live GitHub info (cached across cards)
    const { user: ghUser } = useGitHubUser(githubUsername);

    // Scroll expanded card into view
    useEffect(() => {
        if (isExpanded && cardRef.current) {
            const timer = setTimeout(() => {
                cardRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                });
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isExpanded]);

    return (
        <div
            ref={cardRef}
            className={[
                "bg-surface-2 flex flex-col",
                "neo:rounded-xl neo:border neo:border-black/25",
                "clean:rounded-lg clean:border clean:border-border/20 clean:shadow-sm",
                "overflow-hidden relative",
                "transition-[max-width,flex-basis] duration-300 ease-in-out",
                isExpanded
                    ? "w-full max-w-[576px] basis-[576px]"
                    : "w-full max-w-[280px] basis-[280px] cursor-pointer hover:shadow-lg",
            ].join(" ")}
            onClick={isExpanded ? undefined : onClick}
        >
            <div className={[
                "flex-1",
                useRowLayout
                    ? "flex flex-col md:flex-row overflow-hidden"
                    : "flex flex-col items-center text-center",
            ].join(" ")}>
                {/* Profile section — fixed 280px on desktop when expanded */}
                <div
                    className={
                        isExpanded
                            ? "flex-shrink-0 w-full md:w-[280px] p-5 flex flex-col items-center text-center flex-1"
                            : "p-5 flex flex-col items-center text-center w-full flex-1"
                    }
                >
                    {/* Avatar */}
                    <div className="mb-3">
                        {alumniMember.image &&
                        alumniMember.image !==
                            "https://source.boringavatars.com/beam/" ? (
                            <Image
                                src={alumniMember.image}
                                alt={`Photo of ${alumniMember.name}`}
                                width={96}
                                height={96}
                                className="rounded-full object-cover w-24 h-24"
                                unoptimized
                            />
                        ) : (
                            <Avatar
                                size={96}
                                name={alumniMember.name || "default"}
                                colors={["#426E8C", "#5289AF", "#86ACC7"]}
                                variant="beam"
                            />
                        )}
                    </div>

                    <h4 className="font-bold text-lg text-foreground">
                        {alumniMember.name}
                    </h4>

                    {alumniMember.quote && (
                        <p className="text-sm italic text-muted-foreground mb-2">
                            &quot;{alumniMember.quote}&quot;
                        </p>
                    )}

                    <p className="text-sm font-semibold text-primary">
                        {alumniMember.previous_roles}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {alumniMember.end_date}
                    </p>

                    {/* Live GitHub info */}
                    {ghUser && (ghUser.company || ghUser.location || ghUser.hireable) && (
                        <div className="flex flex-col items-center gap-1 mt-2 mb-4">
                            {ghUser.company && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Building2 className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{ghUser.company}</span>
                                </div>
                            )}
                            {ghUser.location && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{ghUser.location}</span>
                                </div>
                            )}
                            {ghUser.hireable && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full mt-0.5">
                                    <Briefcase className="h-2.5 w-2.5" />
                                    Open to work
                                </span>
                            )}
                        </div>
                    )}

                    {/* Contact & social icons — pinned to bottom */}
                    <div
                        className="flex flex-wrap items-center gap-3 mt-auto pt-3 border-t border-border w-full justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {alumniMember.linkedin && (
                            <a
                                href={ensureLinkedinUrl(alumniMember.linkedin)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                                title="LinkedIn"
                            >
                                <Linkedin className="h-5 w-5" />
                            </a>
                        )}
                        {alumniMember.github && (
                            <a
                                href={ensureGithubUrl(alumniMember.github)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                                title="GitHub"
                            >
                                <Github className="h-5 w-5" />
                            </a>
                        )}
                        {ghUser?.blog && (
                            <a
                                href={ghUser.blog.startsWith("http") ? ghUser.blog : `https://${ghUser.blog}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                                title="Website"
                            >
                                <Globe className="h-5 w-5" />
                            </a>
                        )}
                        {ghUser?.twitter_username && (
                            <a
                                href={`https://x.com/${ghUser.twitter_username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                                title={`@${ghUser.twitter_username}`}
                            >
                                <span className="text-base font-bold leading-none">𝕏</span>
                            </a>
                        )}
                        {alumniMember.showEmail && alumniMember.email && (
                            <a
                                href={`mailto:${alumniMember.email}`}
                                className="text-muted-foreground hover:text-primary transition-colors"
                                title="Email"
                            >
                                <Mail className="h-5 w-5" />
                            </a>
                        )}
                    </div>

                    {/* Edit/Delete slot */}
                    {children && (
                        <div
                            className="mt-3 pt-3 border-t border-border w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {children}
                        </div>
                    )}
                </div>

                {/* Expanded: compact GitHub sidebar */}
                <AnimatePresence
                    initial={false}
                    mode="sync"
                    onExitComplete={() => setSidebarPresent(false)}
                >
                    {isExpanded && hasWidgets && githubUsername && (
                        <motion.div
                            key="widgets"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="min-w-0 border-t md:border-t-0 md:border-l border-border overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 flex flex-col flex-1 min-w-[200px]">
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                    GitHub
                                </p>
                                <GitHubMiniPreview username={githubUsername} />
                                {/* Request Update — pinned to bottom */}
                                <div className="mt-auto pt-3 flex justify-end">
                                    <UpdateAlumniForm alumniMember={alumniMember} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Close button (expanded only) */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-2 right-2 z-10"
                    >
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose?.();
                            }}
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
