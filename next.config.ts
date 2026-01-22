import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true, images: {
    remotePatterns: [
      {
      protocol: 'https',
      hostname: 'example.com',
    },
      {
        protocol: "https",
        hostname: "profile.line-scdn.net",
      },
    ],
  },

};

export default nextConfig;
