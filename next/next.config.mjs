import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  turbopack: {
    // Explicit valid leaf key so Next 15.3 marks Turbopack as configured.
    moduleIds: "named",
  },
  output: "standalone",
};

export default withPayload(nextConfig);
