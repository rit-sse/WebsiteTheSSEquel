import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const envFiles = [".env", ".env.local"];
const loadedFiles = [];

function isPresent(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isTruthy(value) {
  if (!isPresent(value)) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parseDotEnv(raw) {
  const result = {};
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    // Remove inline comments for unquoted values.
    if (
      value.length > 0 &&
      value[0] !== '"' &&
      value[0] !== "'" &&
      value.includes("#")
    ) {
      value = value.split("#")[0].trim();
    }

    // Strip surrounding quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Support escaped newlines commonly used in private keys.
    value = value.replace(/\\n/g, "\n");

    result[key] = value;
  }

  return result;
}

function loadEnvFiles() {
  for (const fileName of envFiles) {
    const fullPath = path.join(projectRoot, fileName);
    if (!fs.existsSync(fullPath)) continue;

    const raw = fs.readFileSync(fullPath, "utf8");
    const parsed = parseDotEnv(raw);

    for (const [key, value] of Object.entries(parsed)) {
      // Preserve already-set shell/CI values.
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }

    loadedFiles.push(fileName);
  }
}

function addMissingForGroup(groupName, keys, errors) {
  const missing = keys.filter((k) => !isPresent(process.env[k]));
  if (missing.length > 0) {
    errors.push(`${groupName}: missing ${missing.join(", ")}`);
  }
}

loadEnvFiles();

const errors = [];
const warnings = [];

/**
 * Core runtime requirements
 * These should always be present for a fully functional local app run.
 */
const requiredCore = [
  "DATABASE_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "SESSION_COOKIE_NAME",
];

addMissingForGroup("Core", requiredCore, errors);

// Basic value sanity checks.
if (isPresent(process.env.NEXTAUTH_URL)) {
  if (!/^https?:\/\//i.test(process.env.NEXTAUTH_URL)) {
    errors.push("Core: NEXTAUTH_URL must start with http:// or https://");
  }
}

if (isPresent(process.env.DATABASE_URL)) {
  if (!/^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL)) {
    warnings.push(
      "DATABASE_URL does not look like a PostgreSQL URL (expected postgres:// or postgresql://)"
    );
  }
}

/**
 * Feature groups:
 * - If any variable in a group is set, require the full group.
 * - If none are set, warn (feature may be unavailable locally).
 */
const featureGroups = [
  {
    name: "Google OAuth",
    vars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    warnIfUnset:
      "Google OAuth is not configured; sign-in via Google will not work locally.",
  },
  {
    name: "Google Calendar",
    vars: ["GCAL_CLIENT_EMAIL", "GCAL_PRIVATE_KEY"],
    warnIfUnset:
      "Google Calendar integration is not configured; calendar sync APIs may fail.",
  },
  {
    name: "AWS S3",
    vars: [
      "AWS_S3_BUCKET_NAME",
      "AWS_S3_REGION",
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
    ],
    warnIfUnset: "AWS S3 is not configured; upload/signing flows may fail.",
  },
  {
    name: "SMTP",
    vars: ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"],
    warnIfUnset:
      "SMTP is not fully configured; email flows may fail (local MailHog config is recommended).",
  },
  {
    name: "Governing Docs GitHub",
    vars: ["GOVERNING_DOCS_GITHUB_TOKEN"],
    warnIfUnset:
      "Governing docs GitHub token is not configured; constitution apply-to-main will fail.",
  },
];

for (const group of featureGroups) {
  const presentCount = group.vars.filter((k) =>
    isPresent(process.env[k])
  ).length;

  if (presentCount === 0) {
    warnings.push(group.warnIfUnset);
    continue;
  }

  if (presentCount < group.vars.length) {
    addMissingForGroup(group.name, group.vars, errors);
  }
}

// Optional validation for SMTP_SECURE when provided.
if (isPresent(process.env.SMTP_SECURE)) {
  const normalized = process.env.SMTP_SECURE.trim().toLowerCase();
  if (
    !["true", "false", "1", "0", "yes", "no", "on", "off"].includes(normalized)
  ) {
    errors.push("SMTP: SMTP_SECURE must be a boolean-like value (true/false)");
  }
}

// Optional: if staging proxy auth is enabled, note expected behavior.
if (isTruthy(process.env.STAGING_PROXY_AUTH)) {
  warnings.push(
    "STAGING_PROXY_AUTH is enabled; ensure trusted proxy headers are present during local testing."
  );
}

const header = "Environment validation (next/scripts/validate-env.mjs)";
console.log(`\n${header}`);
console.log("-".repeat(header.length));
console.log(
  loadedFiles.length > 0
    ? `Loaded env files: ${loadedFiles.join(", ")}`
    : "No .env/.env.local file found. Only shell-provided environment variables were used."
);

if (errors.length > 0) {
  console.error("\n❌ Validation failed:");
  for (const err of errors) {
    console.error(`  - ${err}`);
  }

  if (warnings.length > 0) {
    console.warn("\nWarnings:");
    for (const warning of warnings) {
      console.warn(`  - ${warning}`);
    }
  }

  console.error(
    "\nTip: copy next/.env.example to next/.env and fill in the required values."
  );
  process.exit(1);
}

console.log(
  "\n\x1b[32m✓\x1b[0m Required environment variables are configured."
);

if (warnings.length > 0) {
  console.warn("\nWarnings:");
  for (const warning of warnings) {
    console.warn(`  - ${warning}`);
  }
}

process.exit(0);
