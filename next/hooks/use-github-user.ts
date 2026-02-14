"use client";

import { useEffect, useState } from "react";

export interface GitHubUserInfo {
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

/** In-memory cache so repeated renders / multiple cards don't re-fetch. */
const cache = new Map<string, GitHubUserInfo | null>();
const inflight = new Map<string, Promise<GitHubUserInfo | null>>();

async function fetchGitHubUser(
    username: string
): Promise<GitHubUserInfo | null> {
    if (cache.has(username)) return cache.get(username)!;
    if (inflight.has(username)) return inflight.get(username)!;

    const promise = fetch(`https://api.github.com/users/${username}`)
        .then(async (res) => {
            if (!res.ok) {
                cache.set(username, null);
                return null;
            }
            const data: GitHubUserInfo = await res.json();
            cache.set(username, data);
            return data;
        })
        .catch(() => {
            cache.set(username, null);
            return null;
        })
        .finally(() => {
            inflight.delete(username);
        });

    inflight.set(username, promise);
    return promise;
}

/**
 * Lightweight hook that fetches basic GitHub user info with
 * in-memory caching to avoid duplicate requests across cards.
 */
export function useGitHubUser(username: string | null) {
    const [user, setUser] = useState<GitHubUserInfo | null>(
        username ? cache.get(username) ?? null : null
    );
    const [loading, setLoading] = useState(!cache.has(username ?? ""));

    useEffect(() => {
        if (!username) {
            setUser(null);
            setLoading(false);
            return;
        }

        if (cache.has(username)) {
            setUser(cache.get(username)!);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        fetchGitHubUser(username).then((data) => {
            if (!cancelled) {
                setUser(data);
                setLoading(false);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [username]);

    return { user, loading };
}
