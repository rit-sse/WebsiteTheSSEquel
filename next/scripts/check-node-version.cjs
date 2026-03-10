const supportedMajors = new Set(["20", "22"]);
const currentVersion = process.versions.node;
const [majorStr, minorStr, patchStr] = currentVersion.split(".");
const currentMajor = majorStr;

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

// Node 20 requires >= 20.20.1 to match engines field (^20.20.1 || ^22.0.0)
if (currentMajor === "20") {
  const minor = parseInt(minorStr, 10);
  const patch = parseInt(patchStr, 10);
  if (minor < 20 || (minor === 20 && patch < 1)) {
    console.error(
      [
        "",
        `Node.js ${currentVersion} is too old.`,
        "This repo requires Node.js >= 20.20.1 for the Node 20 line.",
        "Run: nvm use 20.20.1",
        "",
      ].join("\n")
    );
    process.exit(1);
  }
}
