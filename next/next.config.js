const { resolve } = require("path");
const {
  assertMatchingReleaseVersions,
  createBuildVersion,
  normalizeGitCommit,
} = require("./lib/buildVersion");
const { getSecurityHeaders } = require("./lib/securityHeaders");
const { version: releaseVersion } = require("../package.json");
const { version: appPackageVersion } = require("./package.json");

assertMatchingReleaseVersions(releaseVersion, appPackageVersion);
const gitCommit = normalizeGitCommit(process.env.GIT_COMMIT);
const buildVersion = createBuildVersion(releaseVersion, gitCommit);

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: buildVersion,
    NEXT_PUBLIC_COMMIT_HASH: gitCommit ?? "",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: getSecurityHeaders({
          nodeEnv: process.env.NODE_ENV,
          deploymentEnv: process.env.NEXT_PUBLIC_ENV,
          includeCsp: false,
        }),
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.githubusercontent.com",
      },
    ],
    localPatterns: [
      {
        pathname: "/library-assets/**",
      },
      {
        pathname: "/library-icons/**",
      },
      {
        pathname: "/images/**",
      },
      {
        pathname: "/api/**",
      },
      {
        pathname: "/icon",
      },
    ],
  },
  output: "standalone",
  outputFileTracingRoot: resolve(__dirname, ".."),
  turbopack: {
    root: resolve(__dirname, ".."),
  },
};

module.exports = nextConfig;
