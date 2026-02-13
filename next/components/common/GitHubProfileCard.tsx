"use client";

import { useEffect, useRef, useState } from "react";
import {
    ExternalLink,
    Star,
    GitFork,
    Calendar,
} from "lucide-react";
import { getCategoricalColorFromSeed } from "@/lib/categoricalColors";

interface GitHubProfileCardProps {
    /** GitHub username (e.g. "jjalangtry") */
    username: string;
    /** Maximum number of repos to display. 0 disables repos section. */
    maxRepos?: number;
    /** Sort repos by "stars" or "updateTime" */
    sortBy?: "stars" | "updateTime";
}

interface GitHubUser {
    login: string;
    name: string | null;
    avatar_url: string;
    html_url: string;
    bio: string | null;
    company: string | null;
    location: string | null;
    blog: string | null;
    twitter_username: string | null;
    hireable: boolean | null;
    public_repos: number;
    public_gists: number;
    followers: number;
    following: number;
    created_at: string;
}

interface GitHubRepo {
    name: string;
    html_url: string;
    description: string | null;
    stargazers_count: number;
    forks_count: number;
    language: string | null;
    fork: boolean;
    topics: string[];
    homepage: string | null;
}

interface GitHubOrg {
    login: string;
    avatar_url: string;
    description: string | null;
}

// Well-known language colors (subset)
function getLangColor(lang: string): string {
    return getCategoricalColorFromSeed(lang).fill;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * Rich GitHub profile card pulling as much as possible from the public API.
 * Fetches: user profile, repos (with languages + topics), and organizations.
 */
export default function GitHubProfileCard({
    username,
    maxRepos = 3,
    sortBy = "stars",
}: GitHubProfileCardProps) {
    const [user, setUser] = useState<GitHubUser | null>(null);
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [orgs, setOrgs] = useState<GitHubOrg[]>([]);
    const [topLangs, setTopLangs] = useState<{ name: string; count: number }[]>(
        []
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);
        setUser(null);
        setRepos([]);
        setOrgs([]);
        setTopLangs([]);

        async function fetchData() {
            try {
                const [userRes, reposRes, orgsRes] = await Promise.all([
                    fetch(`https://api.github.com/users/${username}`, {
                        signal: controller.signal,
                    }),
                    fetch(
                        `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
                        { signal: controller.signal }
                    ),
                    fetch(`https://api.github.com/users/${username}/orgs`, {
                        signal: controller.signal,
                    }),
                ]);

                if (!userRes.ok) {
                    setError("GitHub user not found");
                    setLoading(false);
                    return;
                }

                const userData: GitHubUser = await userRes.json();
                setUser(userData);

                // Process repos
                if (reposRes.ok) {
                    let repoData: GitHubRepo[] = await reposRes.json();
                    const ownRepos = repoData.filter((r) => !r.fork);

                    // Aggregate languages
                    const langCounts = new Map<string, number>();
                    for (const r of ownRepos) {
                        if (r.language) {
                            langCounts.set(
                                r.language,
                                (langCounts.get(r.language) || 0) + 1
                            );
                        }
                    }
                    const sorted = [...langCounts.entries()]
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 8)
                        .map(([name, count]) => ({ name, count }));
                    setTopLangs(sorted);

                    // Top repos
                    if (maxRepos > 0) {
                        const display = [...ownRepos];
                        if (sortBy === "stars") {
                            display.sort(
                                (a, b) =>
                                    b.stargazers_count - a.stargazers_count
                            );
                        }
                        setRepos(display.slice(0, maxRepos));
                    }
                }

                // Process orgs
                if (orgsRes.ok) {
                    const orgData: GitHubOrg[] = await orgsRes.json();
                    setOrgs(orgData.slice(0, 6));
                }
            } catch (err: any) {
                if (err?.name !== "AbortError") {
                    setError("Failed to load GitHub profile");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchData();
        return () => controller.abort();
    }, [username, maxRepos, sortBy]);

    if (loading) {
        return (
            <div className="rounded-lg border border-border p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-muted" />
                    <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded w-32" />
                        <div className="h-3 bg-muted rounded w-24" />
                    </div>
                </div>
                <div className="h-3 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="rounded-lg border border-border p-6 text-center text-muted-foreground text-sm">
                {error || "Could not load profile"}
            </div>
        );
    }

    const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);

    return (
        <div className="rounded-lg border border-border overflow-hidden">
            {/* Compact header: avatar + name/bio only */}
            <div className="p-4 flex items-center gap-4">
                <a href={user.html_url} target="_blank" rel="noopener noreferrer">
                    <img
                        src={user.avatar_url}
                        alt={user.name || user.login}
                        className="w-12 h-12 shrink-0 aspect-square object-cover rounded-full border border-border"
                    />
                </a>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <a
                            href={user.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-foreground hover:text-primary transition-colors truncate"
                        >
                            {user.name || user.login}
                        </a>
                        <span className="text-sm text-muted-foreground">@{user.login}</span>
                        {user.hireable && (
                            <span className="shrink-0 text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                                Hireable
                            </span>
                        )}
                    </div>
                    {user.bio && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {user.bio}
                        </p>
                    )}
                </div>
            </div>

            {/* Two-column body: Repos (left) | Stats + Languages + Orgs (right) */}
            <div className="flex flex-col lg:flex-row border-t border-border">
                {/* Left: Top Repos */}
                <div className="flex-1 min-w-0">
                    {repos.length > 0 && (
                        <div>
                            <p className="px-4 pt-3 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Top Repositories
                            </p>
                            <ul className="divide-y divide-border">
                                {repos.map((repo) => (
                                    <li key={repo.name} className="px-4 py-2">
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={repo.html_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium text-primary hover:underline truncate"
                                            >
                                                {repo.name}
                                            </a>
                                            {repo.homepage && (
                                                <a
                                                    href={repo.homepage}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                                                    title="Live site"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                        {repo.description && (
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                {repo.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                                            {repo.language && (
                                                <span className="flex items-center gap-1">
                                                    <span
                                                        className="inline-block w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: getLangColor(repo.language) }}
                                                    />
                                                    {repo.language}
                                                </span>
                                            )}
                                            {repo.stargazers_count > 0 && (
                                                <span className="flex items-center gap-0.5">
                                                    <Star className="h-3 w-3" />
                                                    {repo.stargazers_count}
                                                </span>
                                            )}
                                            {repo.forks_count > 0 && (
                                                <span className="flex items-center gap-0.5">
                                                    <GitFork className="h-3 w-3" />
                                                    {repo.forks_count}
                                                </span>
                                            )}
                                        </div>
                                        {repo.topics && repo.topics.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {repo.topics.slice(0, 5).map((t) => (
                                                    <span
                                                        key={t}
                                                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                                                    >
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Right sidebar: Stats + Languages + Orgs */}
                <div className="lg:w-[240px] lg:shrink-0 border-t lg:border-t-0 lg:border-l border-border">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-px bg-border text-center text-xs">
                        <div className="bg-surface-2 py-2 px-1">
                            <p className="font-semibold text-foreground">{user.public_repos}</p>
                            <p className="text-muted-foreground">Repos</p>
                        </div>
                        <div className="bg-surface-2 py-2 px-1">
                            <p className="font-semibold text-foreground">{user.followers}</p>
                            <p className="text-muted-foreground">Followers</p>
                        </div>
                        <div className="bg-surface-2 py-2 px-1">
                            <p className="font-semibold text-foreground">{totalStars}</p>
                            <p className="text-muted-foreground">Stars</p>
                        </div>
                        <div className="bg-surface-2 py-2 px-1">
                            <p className="font-semibold text-foreground">{user.public_gists}</p>
                            <p className="text-muted-foreground">Gists</p>
                        </div>
                    </div>

                    {/* Languages */}
                    {topLangs.length > 0 && (
                        <div className="border-t border-border px-3 py-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                Languages
                            </p>
                            <div className="flex h-2 rounded-full overflow-hidden mb-2">
                                {topLangs.map((l) => {
                                    const total = topLangs.reduce((s, x) => s + x.count, 0);
                                    return (
                                        <div
                                            key={l.name}
                                            className="h-full"
                                            style={{
                                                width: `${(l.count / total) * 100}%`,
                                                backgroundColor: getLangColor(l.name),
                                            }}
                                            title={`${l.name}: ${l.count} repos`}
                                        />
                                    );
                                })}
                            </div>
                            <div className="flex flex-wrap gap-x-2 gap-y-1">
                                {topLangs.map((l) => (
                                    <span key={l.name} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: getLangColor(l.name) }} />
                                        {l.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Organizations */}
                    {orgs.length > 0 && (
                        <div className="border-t border-border px-3 py-3">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                Organizations
                            </p>
                            <div className="flex flex-col gap-1.5">
                                {orgs.map((org) => (
                                    <a
                                        key={org.login}
                                        href={`https://github.com/${org.login}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                                        title={org.description || org.login}
                                    >
                                        <img src={org.avatar_url} alt={org.login} className="w-5 h-5 rounded-sm shrink-0" />
                                        <span className="text-xs text-foreground truncate">{org.login}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Joined date */}
                    <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined {formatDate(user.created_at)}
                    </div>
                </div>
            </div>
        </div>
    );
}
