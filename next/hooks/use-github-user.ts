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
  const cachedUser = cache.get(username);
  if (cachedUser !== undefined) return cachedUser;

  const pendingRequest = inflight.get(username);
  if (pendingRequest !== undefined) return pendingRequest;

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
  const [fetchedUser, setFetchedUser] = useState<GitHubUserInfo | null>(
    username ? (cache.get(username) ?? null) : null
  );
  const [fetchedUsername, setFetchedUsername] = useState<string | null>(
    username && cache.has(username) ? username : null
  );

  const loading =
    username !== null && !cache.has(username) && fetchedUsername !== username;
  const user = username
    ? (cache.get(username) ??
      (fetchedUsername === username ? fetchedUser : null))
    : null;

  useEffect(() => {
    if (!username) {
      return;
    }

    if (cache.has(username)) {
      return;
    }

    let cancelled = false;
    fetchGitHubUser(username).then((data) => {
      if (!cancelled) {
        setFetchedUser(data);
        setFetchedUsername(username);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [username]);

  return { user, loading };
}
