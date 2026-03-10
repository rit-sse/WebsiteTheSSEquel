const {resolve} = require("path");
const { getSecurityHeaders } = require("./lib/securityHeaders");
/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: "/:path*",
                headers: getSecurityHeaders(),
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
        ],
        localPatterns: [
            {
                pathname: "/library-assets/**",
            },
            {
                pathname: "/images/**"
            }
        ],
    },
    output: "standalone",
    outputFileTracingRoot: resolve(__dirname),
    turbopack: {
        root: resolve(__dirname, ".."),
    }
};

module.exports = nextConfig;
