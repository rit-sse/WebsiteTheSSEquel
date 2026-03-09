const supportedMajors = new Set(["20", "22"]);
const currentVersion = process.versions.node;
const currentMajor = currentVersion.split(".")[0];

if (!supportedMajors.has(currentMajor)) {
  console.error(
    [
      "",
      `Unsupported Node.js version: ${currentVersion}`,
      "This repo currently supports Node.js 20.x and 22.x.",
      "CI and Docker use Node.js 20.20.1 by default.",
      "Run one of the following before npm ci:",
      "  source \"$HOME/.nvm/nvm.sh\"",
      "  nvm use 20.20.1",
      "  nvm use 22",
      "",
    ].join("\n")
  );
  process.exit(1);
}
