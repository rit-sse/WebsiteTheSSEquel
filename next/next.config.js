const {resolve} = require("path");
/** @type {import('next').NextConfig} */
const nextConfig = {
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
    },
    output: "standalone",
    turbopack: {
        root: resolve(__dirname, ".."),
    }
}

module.exports = nextConfig;
