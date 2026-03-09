const requiredVersion = "20.20.1";
const currentVersion = process.versions.node;

if (currentVersion !== requiredVersion) {
  console.error(
    [
      "",
      `Unsupported Node.js version: ${currentVersion}`,
      `This repo currently installs and validates on Node.js ${requiredVersion}.`,
      "Run the following before npm ci:",
      "  source \"$HOME/.nvm/nvm.sh\"",
      `  nvm use ${requiredVersion}`,
      "",
    ].join("\n")
  );
  process.exit(1);
}
