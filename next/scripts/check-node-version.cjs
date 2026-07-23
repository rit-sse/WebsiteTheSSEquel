const currentVersion = process.versions.node;
const [majorStr] = currentVersion.split(".");
const isSupportedLts = majorStr === "26";

if (!isSupportedLts) {
  console.error(
    [
      "",
      `Unsupported Node.js version: ${currentVersion}`,
      "This repo supports Node.js 26.x LTS.",
      "CI and Docker use Node.js 26.x LTS by default.",
      "Run one of the following before pnpm install:",
      "  cd next && fnm install && fnm use",
      "  cd next && nvm install && nvm use",
      "",
    ].join("\n")
  );
  process.exit(1);
}
