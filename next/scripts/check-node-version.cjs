const currentVersion = process.versions.node;
const [majorStr, minorStr] = currentVersion.split(".");
const isSupportedLts = majorStr === "24";
const isSupportedForwardVersion = majorStr === "25" && minorStr === "9";

if (!isSupportedLts && !isSupportedForwardVersion) {
  console.error(
    [
      "",
      `Unsupported Node.js version: ${currentVersion}`,
      "This repo supports Node.js 24.x LTS and Node.js 25.9.x.",
      "CI and Docker use Node.js 25.9.0 by default.",
      "Run one of the following before npm ci:",
      "  cd next && fnm install && fnm use",
      "  cd next && nvm install && nvm use",
      "",
    ].join("\n")
  );
  process.exit(1);
}
