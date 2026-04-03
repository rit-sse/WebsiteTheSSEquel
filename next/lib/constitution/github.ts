import { getConstitutionContentsApiUrl, getGoverningDocsConfig } from "@/lib/constitution/config";

type GitHubContentsResponse = {
  sha: string;
  content?: string;
  encoding?: string;
};

function getGithubHeaders(requireToken = false) {
  const config = getGoverningDocsConfig();
  if (requireToken && !config.token) {
    throw new Error("GOVERNING_DOCS_GITHUB_TOKEN is not configured");
  }

  return {
    Accept: "application/vnd.github+json",
    Authorization: config.token ? `Bearer ${config.token}` : "",
    "User-Agent": "WebsiteTheSSEquel Constitution Workflow",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function githubFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...getGithubHeaders(false),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub request failed (${response.status}): ${body}`);
  }

  return response;
}

export async function getConstitutionGithubContents() {
  const response = await githubFetch(getConstitutionContentsApiUrl());
  const json = (await response.json()) as GitHubContentsResponse;
  const markdown =
    json.content && json.encoding === "base64"
      ? Buffer.from(json.content, "base64").toString("utf8")
      : "";

  return {
    sha: json.sha,
    markdown,
  };
}

export async function commitConstitutionMarkdownToGitHub(input: {
  nextMarkdown: string;
  expectedSha: string;
  commitMessage: string;
}) {
  const config = getGoverningDocsConfig();
  const response = await fetch(getConstitutionContentsApiUrl(), {
    method: "PUT",
    headers: {
      ...getGithubHeaders(true),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: input.commitMessage,
      content: Buffer.from(input.nextMarkdown, "utf8").toString("base64"),
      sha: input.expectedSha,
      branch: config.branch,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub commit failed (${response.status}): ${body}`);
  }

  const json = (await response.json()) as {
    commit?: { sha?: string };
    content?: { sha?: string };
  };

  return {
    commitSha: json.commit?.sha ?? "",
    contentSha: json.content?.sha ?? "",
  };
}
