export function getGoverningDocsConfig() {
  return {
    owner: process.env.GOVERNING_DOCS_REPO_OWNER || "rit-sse",
    repo: process.env.GOVERNING_DOCS_REPO_NAME || "governing-docs",
    branch: process.env.GOVERNING_DOCS_BRANCH || "main",
    constitutionPath:
      process.env.GOVERNING_DOCS_CONSTITUTION_PATH || "constitution.md",
    token: process.env.GOVERNING_DOCS_GITHUB_TOKEN || "",
  };
}

export function getConstitutionRawUrl() {
  const config = getGoverningDocsConfig();
  return `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${config.constitutionPath}`;
}

export function getConstitutionContentsApiUrl() {
  const config = getGoverningDocsConfig();
  return `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.constitutionPath}?ref=${config.branch}`;
}
