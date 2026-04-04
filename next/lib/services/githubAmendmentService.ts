const GOVERNING_DOC_OWNER = "rit-sse";
const GOVERNING_DOC_REPO = "governing-docs";
const GOVERNING_DOC_BRANCH = "main";
const GOVERNING_DOC_PATH = "constitution.md";
const GOVERNING_DOCS_API = `https://api.github.com/repos/${GOVERNING_DOC_OWNER}/${GOVERNING_DOC_REPO}`;

type GitHubFileResponse = {
  content: string;
  sha: string;
  encoding: string;
};

type GitHubRefResponse = {
  object: {
    sha: string;
    type: string;
    url: string;
  };
};

type GitHubPullRequest = {
  number: number;
  html_url: string;
  mergeable: boolean | null;
};

export type ConstitutionFileSnapshot = {
  content: string;
  sha: string;
};

export type AmendmentPRResult = {
  branch: string;
  prNumber: number;
  prUrl: string;
  originalContent: string;
};

function getGithubToken(): string {
  const token = process.env.GITHUB_PAT;
  if (!token) {
    throw new Error("GITHUB_PAT is not configured on the server.");
  }
  return token;
}

async function fetchGithub(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${getGithubToken()}`);
  headers.set("X-GitHub-Api-Version", "2022-11-28");
  headers.set("User-Agent", "sse-amendment-feature");

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/vnd.github+json");
  }
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`GitHub API request failed (${response.status}): ${message}`);
  }
  return response;
}

function decodeBase64File(content: string): string {
  return Buffer.from(content, "base64").toString("utf-8");
}

function sanitizePath(path: string): string {
  if (!path.includes("/")) {
    return encodeURIComponent(path);
  }
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export async function fetchConstitutionSnapshot(): Promise<ConstitutionFileSnapshot> {
  const encodedPath = sanitizePath(GOVERNING_DOC_PATH);
  const response = await fetchGithub(
    `${GOVERNING_DOCS_API}/contents/${encodedPath}?ref=${GOVERNING_DOC_BRANCH}`,
    {
      method: "GET",
    },
  );
  const json = (await response.json()) as GitHubFileResponse;
  if (!json?.content || !json?.sha) {
    throw new Error("GitHub API did not return a valid constitution file payload.");
  }

  const content = decodeBase64File(json.content.replace(/\n/g, ""));
  return {
    sha: json.sha,
    content,
  };
}

async function createAmendmentBranch(branchName: string): Promise<void> {
  const baseRefResponse = await fetchGithub(`${GOVERNING_DOCS_API}/git/ref/heads/${GOVERNING_DOC_BRANCH}`, {
    method: "GET",
  });
  const baseRef = (await baseRefResponse.json()) as GitHubRefResponse;

  await fetchGithub(`${GOVERNING_DOCS_API}/git/refs`, {
    method: "POST",
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: baseRef.object.sha,
    }),
  });
}

async function commitConstitutionToBranch(params: {
  branch: string;
  content: string;
  originalSha: string;
  proposedBy: string;
}): Promise<void> {
  const encodedPath = sanitizePath(GOVERNING_DOC_PATH);
  const base64Content = Buffer.from(params.content).toString("base64");

  await fetchGithub(`${GOVERNING_DOCS_API}/contents/${encodedPath}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `Amendment draft by ${params.proposedBy}`,
      content: base64Content,
      sha: params.originalSha,
      branch: params.branch,
    }),
  });
}

export async function createAmendmentPR(params: {
  title: string;
  description: string;
  proposedContent: string;
  proposedBy: string;
  branchName: string;
}): Promise<AmendmentPRResult> {
  const { title, description, proposedContent, proposedBy, branchName } = params;
  const snapshot = await fetchConstitutionSnapshot();
  await createAmendmentBranch(branchName);
  await commitConstitutionToBranch({
    branch: branchName,
    content: proposedContent,
    originalSha: snapshot.sha,
    proposedBy,
  });

  const prResponse = await fetchGithub(`${GOVERNING_DOCS_API}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title,
      body: description,
      head: branchName,
      base: GOVERNING_DOC_BRANCH,
      maintainer_can_modify: true,
    }),
  });

  const pr = (await prResponse.json()) as GitHubPullRequest;
  if (!pr.number) {
    throw new Error("GitHub did not return a pull request number.");
  }

  return {
    branch: branchName,
    prNumber: pr.number,
    prUrl: pr.html_url,
    originalContent: snapshot.content,
  };
}

export async function fetchPRDiff(prNumber: number): Promise<string> {
  const response = await fetchGithub(`${GOVERNING_DOCS_API}/pulls/${prNumber}.diff`, {
    method: "GET",
    headers: {
      Accept: "application/vnd.github.v3.diff",
    },
  });

  return response.text();
}

export async function mergePR(prNumber: number): Promise<void> {
  await fetchGithub(`${GOVERNING_DOCS_API}/pulls/${prNumber}/merge`, {
    method: "PUT",
    body: JSON.stringify({
      merge_method: "merge",
    }),
  });
}

export async function closePR(prNumber: number): Promise<void> {
  await fetchGithub(`${GOVERNING_DOCS_API}/pulls/${prNumber}`, {
    method: "PATCH",
    body: JSON.stringify({
      state: "closed",
    }),
  });
}
