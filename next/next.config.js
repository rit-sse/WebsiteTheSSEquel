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
}

module.exports = nextConfig
