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
 * Validate and return the release version shared by the workspace and app.
 * Release Please updates both package files together in each release PR.
 *
 * @param {string} workspaceVersion
 * @param {string} appPackageVersion
 * @returns {string}
 */
function resolveReleaseVersion(workspaceVersion, appPackageVersion) {
  if (workspaceVersion !== appPackageVersion) {
    throw new Error(
      "Application version mismatch: package.json and next/package.json " +
        "must contain the same version."
    );
  }

  if (!SEMVER_PATTERN.test(workspaceVersion)) {
    throw new Error(
      `Invalid application version "${workspaceVersion}". ` +
        "Set package.json and next/package.json to a valid SemVer value."
    );
  }

  return workspaceVersion;
}

module.exports = {
  resolveReleaseVersion,
};
