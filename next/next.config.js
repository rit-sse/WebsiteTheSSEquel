const { resolve } = require("path");
const { resolveReleaseVersion } = require("./lib/releaseVersion");
const { getSecurityHeaders } = require("./lib/securityHeaders");
const { version: workspaceVersion } = require("../package.json");
const { version: appPackageVersion } = require("./package.json");

const releaseVersion = resolveReleaseVersion(
  workspaceVersion,
  appPackageVersion
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: releaseVersion,
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
