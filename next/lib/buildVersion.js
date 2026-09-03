const numericIdentifier = "(?:0|[1-9]\\d*)";
const alphanumericIdentifier = "(?:\\d*[A-Za-z-][0-9A-Za-z-]*)";
const prereleaseIdentifier = `(?:${numericIdentifier}|${alphanumericIdentifier})`;
const buildIdentifier = "[0-9A-Za-z-]+";

const SEMVER_PATTERN = new RegExp(
  `^${numericIdentifier}\\.${numericIdentifier}\\.${numericIdentifier}` +
    `(?:-${prereleaseIdentifier}(?:\\.${prereleaseIdentifier})*)?` +
    `(?:\\+${buildIdentifier}(?:\\.${buildIdentifier})*)?$`
);

/**
 * Normalize a Git object ID before exposing it as build metadata or a link.
 * Seven characters is Git's conventional minimum abbreviation. The upper
 * bound supports both SHA-1 and SHA-256 repositories.
 *
 * @param {unknown} value
 * @returns {string | undefined}
 */
function normalizeGitCommit(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const commit = value.trim().toLowerCase();
  return /^[0-9a-f]{7,64}$/.test(commit) ? commit : undefined;
}

/**
 * Keep the workspace release metadata and application package synchronized.
 * Release Please updates both files in the same release pull request.
 *
 * @param {string} workspaceVersion
 * @param {string} appPackageVersion
 */
function assertMatchingReleaseVersions(workspaceVersion, appPackageVersion) {
  if (workspaceVersion !== appPackageVersion) {
    throw new Error(
      "Application version mismatch: package.json and next/package.json " +
        "must contain the same version."
    );
  }
}

/**
 * Produce a SemVer build identifier while preserving the release version's
 * precedence. For example, 1.2.3 and abcdef123 become 1.2.3+abcdef1.
 *
 * @param {string} releaseVersion
 * @param {unknown} commitValue
 * @returns {string}
 */
function createBuildVersion(releaseVersion, commitValue) {
  if (!SEMVER_PATTERN.test(releaseVersion)) {
    throw new Error(
      `Invalid application version "${releaseVersion}". ` +
        "Set package.json and next/package.json to a valid SemVer value."
    );
  }

  const commit = normalizeGitCommit(commitValue);
  if (!commit) {
    return releaseVersion;
  }

  const shortCommit = commit.slice(0, 7);
  const separator = releaseVersion.includes("+") ? "." : "+";
  return `${releaseVersion}${separator}${shortCommit}`;
}

module.exports = {
  assertMatchingReleaseVersions,
  createBuildVersion,
  normalizeGitCommit,
};
