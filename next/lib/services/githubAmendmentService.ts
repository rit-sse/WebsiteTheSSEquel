import jwt from "jsonwebtoken";

const GOVERNING_DOC_OWNER = "rit-sse";
const GOVERNING_DOC_REPO = "governing-docs";
const GOVERNING_DOC_BRANCH = "main";
const GOVERNING_DOC_PATH = "constitution.md";
const GOVERNING_DOCS_API = `https://api.github.com/repos/${GOVERNING_DOC_OWNER}/${GOVERNING_DOC_REPO}`;
const GITHUB_API_VERSION = "2022-11-28";
const GITHUB_INSTALLATION_TOKEN_BUFFER_MS = 60_000;

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

type GitHubInstallation = {
  id: number;
};

type GitHubInstallationToken = {
  token: string;
  expires_at: string;
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

export function buildAmendmentBranchName(
  title: string,
  amendmentId: number,
): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  const safeTitle = slug.length > 0 ? slug : "amendment";
  return `amendment-${amendmentId}-${safeTitle}-${Date.now().toString(36)}`;
}

function normalizeGithubPrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, "\n").trim();
}

function getLegacyGithubToken(): string | null {
  const token = process.env.GITHUB_PAT?.trim();
  return token && token.length > 0 ? token : null;
}

function getGithubAppConfig():
  | {
      appId: string;
      installationId: number | null;
      privateKey: string;
    }
  | null {
  const appId = process.env.GITHUB_APP_ID?.trim();
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.trim();

  if (!appId || !privateKey) {
    return null;
  }

  const installationIdValue = process.env.GITHUB_APP_INSTALLATION_ID?.trim();
  const installationId = installationIdValue ? Number(installationIdValue) : null;

  if (installationIdValue && Number.isNaN(installationId)) {
    throw new Error("GITHUB_APP_INSTALLATION_ID must be a number when provided.");
  }

  return {
    appId,
    installationId,
    privateKey: normalizeGithubPrivateKey(privateKey),
  };
}

function createGithubAppJwt(): string {
  const config = getGithubAppConfig();
  if (!config) {
    throw new Error("GitHub App credentials are not configured on the server.");
  }

  const now = Math.floor(Date.now() / 1000);
  // NOTE: do NOT pass `noTimestamp: true` here. jsonwebtoken deletes the `iat`
  // claim from the payload when that option is set (see node_modules/
  // jsonwebtoken/sign.js), even if we set it manually. GitHub rejects the
  // JWT assertion with "Missing 'issued at' claim ('iat')" when that happens.
  // With `noTimestamp` unset, the library preserves our manual `iat` value.
  return jwt.sign(
    {
      iat: now - 60,
      exp: now + 9 * 60,
      iss: config.appId,
    },
    config.privateKey,
    {
      algorithm: "RS256",
    },
  );
}

let cachedInstallationToken:
  | {
      token: string;
      expiresAtMs: number;
    }
  | null = null;
let cachedInstallationTokenPromise: Promise<string> | null = null;
let cachedInstallationId: number | null = null;

async function fetchGithubWithJwt(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${createGithubAppJwt()}`);
  headers.set("X-GitHub-Api-Version", GITHUB_API_VERSION);
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
    throw new Error(
      `GitHub App request failed (${response.status}): ${message}`,
    );
  }

  return response;
}

async function resolveGithubInstallationId(): Promise<number> {
  const config = getGithubAppConfig();
  if (!config) {
    throw new Error("GitHub App credentials are not configured on the server.");
  }

  if (config.installationId) {
    cachedInstallationId = config.installationId;
    return config.installationId;
  }

  if (cachedInstallationId) {
    return cachedInstallationId;
  }

  const response = await fetchGithubWithJwt(
    `${GOVERNING_DOCS_API}/installation`,
    {
      method: "GET",
    },
  );
  const installation = (await response.json()) as GitHubInstallation;

  if (!installation?.id) {
    throw new Error(
      `GitHub App is not installed on ${GOVERNING_DOC_OWNER}/${GOVERNING_DOC_REPO}.`,
    );
  }

  cachedInstallationId = installation.id;
  return installation.id;
}

async function getGithubInstallationToken(): Promise<string> {
  if (
    cachedInstallationToken &&
    cachedInstallationToken.expiresAtMs - GITHUB_INSTALLATION_TOKEN_BUFFER_MS >
      Date.now()
  ) {
    return cachedInstallationToken.token;
  }

  if (!cachedInstallationTokenPromise) {
    cachedInstallationTokenPromise = (async () => {
      const installationId = await resolveGithubInstallationId();
      const response = await fetchGithubWithJwt(
        `https://api.github.com/app/installations/${installationId}/access_tokens`,
        {
          method: "POST",
        },
      );
      const token = (await response.json()) as GitHubInstallationToken;
      const expiresAtMs = Date.parse(token.expires_at);

      if (!token.token || Number.isNaN(expiresAtMs)) {
        throw new Error("GitHub App did not return a valid installation token.");
      }

      cachedInstallationToken = {
        token: token.token,
        expiresAtMs,
      };

      return token.token;
    })().finally(() => {
      cachedInstallationTokenPromise = null;
    });
  }

  return cachedInstallationTokenPromise;
}

async function getGithubToken(): Promise<string> {
  if (getGithubAppConfig()) {
    return getGithubInstallationToken();
  }

  const token = getLegacyGithubToken();
  if (!token) {
    throw new Error(
      "Neither GitHub App credentials nor GITHUB_PAT are configured on the server.",
    );
  }
  return token;
}

async function fetchGithub(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${await getGithubToken()}`);
  headers.set("X-GitHub-Api-Version", GITHUB_API_VERSION);
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
    throw new Error(
      `GitHub API request failed (${response.status}): ${message}`,
    );
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
    throw new Error(
      "GitHub API did not return a valid constitution file payload.",
    );
  }

  const content = decodeBase64File(json.content.replace(/\n/g, ""));
  return {
    sha: json.sha,
    content,
  };
}

async function createAmendmentBranch(branchName: string): Promise<void> {
  const baseRefResponse = await fetchGithub(
    `${GOVERNING_DOCS_API}/git/ref/heads/${GOVERNING_DOC_BRANCH}`,
    {
      method: "GET",
    },
  );
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
  const { title, description, proposedContent, proposedBy, branchName } =
    params;
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
  const response = await fetchGithub(
    `${GOVERNING_DOCS_API}/pulls/${prNumber}.diff`,
    {
      method: "GET",
      headers: {
        Accept: "application/vnd.github.v3.diff",
      },
    },
  );

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
